import "server-only";

import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Role, SessionUser } from "@/types/domain";

export async function getUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login?reason=signed-out");
  return user;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data: membership, error } = await supabase
    .from("memberships")
    .select("organization_id, role, organizations!inner(name)")
    .eq("profile_id", user.id)
    .limit(1)
    .maybeSingle();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !membership || !profile) return null;
  return {
    id: user.id,
    organizationId: membership.organization_id,
    name: profile.display_name,
    organization: membership.organizations.name,
    role: membership.role,
  };
}

export async function requireRole(allowed: Role | readonly Role[]) {
  const session = await getSessionUser();
  if (!session) redirect("/login?reason=signed-out");
  const roles = Array.isArray(allowed) ? allowed : [allowed];
  if (!roles.includes(session.role)) notFound();
  return session;
}

export async function requireApplicationAccess(applicationId: string) {
  const parsedId = z.uuid().safeParse(applicationId);
  if (!parsedId.success) notFound();
  const session = await requireRole(["sme", "buyer", "funder"]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("id", parsedId.data)
    .maybeSingle();
  if (error || !data) notFound();
  return { application: data, session };
}
