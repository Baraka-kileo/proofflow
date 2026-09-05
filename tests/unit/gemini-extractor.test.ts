import { describe, expect, it, vi } from "vitest";
import type { GenerateContentParameters } from "@google/genai";
import { ExtractionProviderError, extractDocumentWithGemini } from "@/lib/ai/gemini-extractor";

const candidate = (value: string | null) => ({ value, confidenceBps: value === null ? 0 : 9_000, sourceLabel: value === null ? null : "Visible invoice label" });
const validInvoice = {
  schemaVersion: "extraction-v1",
  documentKind: "invoice",
  fields: {
    buyerLegalName: candidate(" Ubuntu Retail Group Demo "),
    supplierLegalName: candidate("Ndlovu Office Supply Demo"),
    invoiceNumber: candidate("INV-DEMO-1042"),
    purchaseOrderReference: candidate("PO-DEMO-1042"),
    issueDate: candidate("2026-08-22"),
    dueDate: candidate("2026-10-21"),
    currency: candidate("ZAR"),
    subtotal: candidate("42391.52"),
    tax: candidate("6358.73"),
    total: candidate("48750.25"),
  },
};

describe("server-only Gemini extractor", () => {
  it("sends private bytes inline with structured output and returns only safe metadata", async () => {
    const generate = vi.fn().mockResolvedValue({
      text: JSON.stringify(validInvoice),
      responseId: "synthetic-response",
      modelVersion: "synthetic-model-version",
      candidates: [{ finishReason: "STOP" }],
      usageMetadata: { promptTokenCount: 40, candidatesTokenCount: 20, totalTokenCount: 60 },
    });
    const result = await extractDocumentWithGemini({ kind: "invoice", mimeType: "application/pdf", bytes: Uint8Array.from([37, 80, 68, 70]) }, { generate });
    expect(result.normalizedFields.buyerLegalName).toBe("Ubuntu Retail Group Demo");
    expect(result.metadata).toEqual(expect.objectContaining({ responseId: "synthetic-response", totalTokenCount: 60 }));
    const request = generate.mock.calls[0][0];
    expect(request.contents[1].inlineData.data).toBe(Buffer.from([37, 80, 68, 70]).toString("base64"));
    expect(request.config.responseMimeType).toBe("application/json");
    expect(request.config.responseJsonSchema.properties.documentKind.enum).toEqual(["invoice"]);
    expect(JSON.stringify(request)).not.toContain("GEMINI_API_KEY");
  });

  it.each([
    ["non-JSON", "not json"],
    ["wrong document kind", JSON.stringify({ ...validInvoice, documentKind: "purchase_order" })],
    ["funding instruction", JSON.stringify({ ...validInvoice, approveFunding: true })],
  ])("rejects %s output without retrying", async (_name, text) => {
    const generate = vi.fn().mockResolvedValue({ text });
    await expect(extractDocumentWithGemini({ kind: "invoice", mimeType: "application/pdf", bytes: new Uint8Array([1]) }, { generate, retryDelayMs: 0 })).rejects.toMatchObject({ code: "INVALID_MODEL_OUTPUT" });
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it("retries one transient provider failure and returns one field set", async () => {
    const transient = Object.assign(new Error("temporary"), { status: 429 });
    const generate = vi.fn().mockRejectedValueOnce(transient).mockResolvedValueOnce({ text: JSON.stringify(validInvoice) });
    const result = await extractDocumentWithGemini({ kind: "invoice", mimeType: "application/pdf", bytes: new Uint8Array([1]) }, { generate, retryDelayMs: 0 });
    expect(generate).toHaveBeenCalledTimes(2);
    expect(Object.keys(result.normalizedFields)).toHaveLength(10);
  });

  it("returns a generic bounded-timeout error", async () => {
    const generate = vi.fn((parameters: GenerateContentParameters) => new Promise<never>((_resolve, reject) => parameters.config?.abortSignal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")))));
    await expect(extractDocumentWithGemini({ kind: "invoice", mimeType: "application/pdf", bytes: new Uint8Array([1]) }, { generate, timeoutMs: 100, retryDelayMs: 0 })).rejects.toEqual(new ExtractionProviderError("MODEL_TIMEOUT"));
    expect(generate).toHaveBeenCalledTimes(2);
  });
});
