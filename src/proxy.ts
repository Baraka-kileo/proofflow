import type { NextRequest } from "next/server";
import { refreshSupabaseSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return refreshSupabaseSession(request);
}

export const config = {
  matcher: ["/dashboard/:path*", "/applications/:path*", "/confirmations/:path*", "/documents/:path*", "/offers/:path*", "/trust-passport/:path*", "/help/:path*", "/account/:path*"],
};
