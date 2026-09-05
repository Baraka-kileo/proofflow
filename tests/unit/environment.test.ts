import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getGeminiEnvironment,
  getServerEnvironment,
  getSupabaseAdminEnvironment,
  getSupabaseEnvironment,
} from "@/lib/env/server";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("server environment validation", () => {
  it("allows the demo shell to run without live service credentials", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("PROOFFLOW_EXTRACTION_MODE", "");

    expect(getServerEnvironment()).toMatchObject({
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NEXT_PUBLIC_SUPABASE_URL: undefined,
      SUPABASE_SERVICE_ROLE_KEY: undefined,
      PROOFFLOW_EXTRACTION_MODE: "live",
    });
  });

  it("gives a helpful error when live Supabase values are missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    expect(() => getSupabaseEnvironment()).toThrow(
      /live Supabase mode is not configured.*NEXT_PUBLIC_SUPABASE_URL.*NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/,
    );
  });

  it("keeps admin and AI secrets behind explicit server-only checks", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "public-test-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "");

    expect(() => getSupabaseAdminEnvironment()).toThrow(/server-only Supabase admin/);
    expect(() => getGeminiEnvironment()).toThrow(/live document extraction/);
  });
});
