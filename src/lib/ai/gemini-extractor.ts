import "server-only";

import { GoogleGenAI, type GenerateContentParameters } from "@google/genai";
import { getGeminiEnvironment } from "@/lib/env/server";
import type { DocumentKind } from "@/lib/documents/validation";
import {
  GEMINI_RESPONSE_JSON_SCHEMAS,
  getExtractionPrompt,
  getExtractionV1Schema,
  type ExtractionV1,
} from "@/lib/ai/extraction-v1";

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";
const DEFAULT_TIMEOUT_MS = 20_000;
const MAX_ATTEMPTS = 2;

type ProviderResponse = {
  text?: string;
  responseId?: string;
  modelVersion?: string;
  candidates?: Array<{ finishReason?: string }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
};

export type GeminiGenerate = (parameters: GenerateContentParameters) => Promise<ProviderResponse>;

export class ExtractionProviderError extends Error {
  constructor(public readonly code: "MODEL_UNAVAILABLE" | "MODEL_TIMEOUT" | "INVALID_MODEL_OUTPUT") {
    super(code);
    this.name = "ExtractionProviderError";
  }
}

function isTransientProviderError(error: unknown) {
  if (error instanceof ExtractionProviderError) return error.code === "MODEL_TIMEOUT";
  if (!(error instanceof Error)) return false;
  const status = "status" in error && typeof error.status === "number" ? error.status : undefined;
  return error.name === "AbortError" || status === 408 || status === 429 || Boolean(status && status >= 500);
}

function normalizedFields(extraction: ExtractionV1) {
  return Object.fromEntries(Object.entries(extraction.fields).map(([name, field]) => {
    const value = field.value;
    return [name, typeof value === "string" ? value.trim() : value];
  }));
}

export async function extractDocumentWithGemini(input: {
  kind: DocumentKind;
  mimeType: "application/pdf" | "image/jpeg" | "image/png";
  bytes: Uint8Array;
}, options: {
  generate?: GeminiGenerate;
  model?: string;
  timeoutMs?: number;
  retryDelayMs?: number;
} = {}) {
  const environment = options.generate ? null : getGeminiEnvironment();
  const model = options.model ?? DEFAULT_GEMINI_MODEL;
  const ai = options.generate ? null : new GoogleGenAI({ apiKey: environment!.GEMINI_API_KEY });
  const generate = options.generate ?? ((parameters: GenerateContentParameters) => ai!.models.generateContent(parameters));
  const timeoutMs = Math.min(Math.max(options.timeoutMs ?? DEFAULT_TIMEOUT_MS, 100), 30_000);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await generate({
        model,
        contents: [
          { text: getExtractionPrompt(input.kind) },
          { inlineData: { mimeType: input.mimeType, data: Buffer.from(input.bytes).toString("base64") } },
        ],
        config: {
          abortSignal: controller.signal,
          candidateCount: 1,
          temperature: 0,
          responseMimeType: "application/json",
          responseJsonSchema: GEMINI_RESPONSE_JSON_SCHEMAS[input.kind],
        },
      });
      if (!response.text) throw new ExtractionProviderError("INVALID_MODEL_OUTPUT");
      let raw: unknown;
      try {
        raw = JSON.parse(response.text);
      } catch {
        throw new ExtractionProviderError("INVALID_MODEL_OUTPUT");
      }
      const parsed = getExtractionV1Schema(input.kind).safeParse(raw);
      if (!parsed.success) throw new ExtractionProviderError("INVALID_MODEL_OUTPUT");
      return {
        extraction: parsed.data as ExtractionV1,
        normalizedFields: normalizedFields(parsed.data as ExtractionV1),
        provider: "google-gemini" as const,
        model,
        metadata: {
          responseId: response.responseId ?? null,
          modelVersion: response.modelVersion ?? null,
          finishReason: response.candidates?.[0]?.finishReason ?? null,
          promptTokenCount: response.usageMetadata?.promptTokenCount ?? null,
          candidatesTokenCount: response.usageMetadata?.candidatesTokenCount ?? null,
          totalTokenCount: response.usageMetadata?.totalTokenCount ?? null,
        },
      };
    } catch (error) {
      const timedOut = controller.signal.aborted;
      const safeError = timedOut ? new ExtractionProviderError("MODEL_TIMEOUT") : error;
      if (attempt < MAX_ATTEMPTS && isTransientProviderError(safeError)) {
        await new Promise((resolve) => setTimeout(resolve, options.retryDelayMs ?? 250));
        continue;
      }
      if (safeError instanceof ExtractionProviderError) throw safeError;
      throw new ExtractionProviderError("MODEL_UNAVAILABLE");
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new ExtractionProviderError("MODEL_UNAVAILABLE");
}
