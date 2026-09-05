import "server-only";

import { z } from "zod";

const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalSecret = z.preprocess(blankToUndefined, z.string().min(1).optional());
const optionalUrl = z.preprocess(blankToUndefined, z.url().optional());

const environmentSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optionalSecret,
  SUPABASE_SERVICE_ROLE_KEY: optionalSecret,
  GEMINI_API_KEY: optionalSecret,
  PROOFFLOW_ENABLE_DEMO_ACCESS: z.enum(["true", "false"]).default("false"),
  PROOFFLOW_DEMO_PASSWORD: optionalSecret,
});

export type ServerEnvironment = z.infer<typeof environmentSchema>;

function readEnvironment(): Record<keyof ServerEnvironment, string | undefined> {
  return {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    PROOFFLOW_ENABLE_DEMO_ACCESS: process.env.PROOFFLOW_ENABLE_DEMO_ACCESS,
    PROOFFLOW_DEMO_PASSWORD: process.env.PROOFFLOW_DEMO_PASSWORD,
  };
}

function describeEnvironmentError(error: z.ZodError) {
  const fields = [...new Set(error.issues.map((issue) => issue.path.join(".")))];
  return `ProofFlow environment configuration is invalid: ${fields.join(", ")}. Check the server's environment variables against .env.example.`;
}

export function getServerEnvironment(): ServerEnvironment {
  const parsed = environmentSchema.safeParse(readEnvironment());

  if (!parsed.success) {
    throw new Error(describeEnvironmentError(parsed.error));
  }

  return parsed.data;
}

export function getSupabaseEnvironment() {
  const environment = getServerEnvironment();
  const liveSchema = z.object({
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  });
  const parsed = liveSchema.safeParse(environment);

  if (!parsed.success) {
    throw new Error(
      "ProofFlow live Supabase mode is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local or the deployment environment.",
    );
  }

  return parsed.data;
}

export function getSupabaseAdminEnvironment() {
  const environment = getServerEnvironment();
  const supabase = getSupabaseEnvironment();

  if (!environment.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "ProofFlow's server-only Supabase admin workflow is not configured. Add SUPABASE_SERVICE_ROLE_KEY to the server environment; never expose it with NEXT_PUBLIC_.",
    );
  }

  return {
    ...supabase,
    SUPABASE_SERVICE_ROLE_KEY: environment.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export function getGeminiEnvironment() {
  const environment = getServerEnvironment();

  if (!environment.GEMINI_API_KEY) {
    throw new Error(
      "ProofFlow live document extraction is not configured. Add GEMINI_API_KEY to the server environment.",
    );
  }

  return { GEMINI_API_KEY: environment.GEMINI_API_KEY };
}

export function getDemoAuthEnvironment() {
  const environment = getServerEnvironment();
  if (environment.PROOFFLOW_ENABLE_DEMO_ACCESS !== "true" || !environment.PROOFFLOW_DEMO_PASSWORD) {
    throw new Error("ProofFlow one-click demo access is disabled or missing its server-only demo password.");
  }
  return { PROOFFLOW_DEMO_PASSWORD: environment.PROOFFLOW_DEMO_PASSWORD };
}
