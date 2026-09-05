import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminEnvironment } from "@/lib/env/server";
import type { Database } from "@/types/database";

export function createAdminClient() {
  const environment = getSupabaseAdminEnvironment();
  return createSupabaseClient<Database>(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
