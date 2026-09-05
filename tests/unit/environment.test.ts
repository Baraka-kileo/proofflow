import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getServerEnvironment,
  getSupabaseAdminEnvironment,
  getSupabaseEnvironment,
} from "@/lib/env/server";

afterEach(() => vi.unstubAllEnvs());

describe("server environment validation", () => {
  it("runs without optional testing or service credentials", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("PROOFFLOW_ENABLE_TEST_CREDENTIALS", "");
    vi.stubEnv("PROOFFLOW_TEST_PASSWORD", "");

    expect(getServerEnvironment()).toMatchObject({
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NEXT_PUBLIC_SUPABASE_URL: undefined,
      SUPABASE_SERVICE_ROLE_KEY: undefined,
      PROOFFLOW_ENABLE_TEST_CREDENTIALS: "false",
      PROOFFLOW_TEST_PASSWORD: undefined,
    });
  });

  it("gives a helpful error when live Supabase values are missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    expect(() => getSupabaseEnvironment()).toThrow(/live Supabase mode is not configured/);
  });

  it("keeps the admin secret behind an explicit server-only check", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "public-test-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect(() => getSupabaseAdminEnvironment()).toThrow(/server-only Supabase admin/);
  });
});
