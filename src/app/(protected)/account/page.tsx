import {
  Building2,
  Cable,
  CheckCircle2,
  LogOut,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole, requireUser } from "@/lib/auth/dal";
import { signOut } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { DemoConnectionControl } from "@/features/integrations/demo-connection-control";

export const metadata: Metadata = { title: "Account" };

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 rounded-xl bg-[var(--soft)] p-4">
      <Icon
        aria-hidden="true"
        className="mt-0.5 size-5 shrink-0 text-[var(--primary)]"
      />
      <div className="min-w-0">
        <dt className="text-xs font-semibold text-[var(--muted)]">{label}</dt>
        <dd className="mt-1 break-words text-sm font-bold capitalize">
          {value}
        </dd>
      </div>
    </div>
  );
}

export default async function AccountPage() {
  const [session, authUser] = await Promise.all([
    requireRole(["sme", "buyer", "funder"]),
    requireUser(),
  ]);
  const client = (await createClient()) as unknown as SupabaseClient;
  const { data: connection } =
    session.role === "buyer"
      ? await client
          .from("integration_connections")
          .select("id,provider,mode,status,demo_scenario,last_successful_sync_at")
          .eq("buyer_organization_id", session.organizationId)
          .eq("provider", "coupa")
          .maybeSingle()
      : { data: null };
  return (
    <div className="page-enter mx-auto max-w-3xl">
      <PageHeading
        eyebrow="Account"
        title="Your ProofFlow identity"
        description="These hosted identity details determine the organization and role used for every protected action."
      />
      <Card className="mt-10">
        <CardContent className="pt-6">
          <dl className="grid gap-3 sm:grid-cols-2">
            <Fact icon={UserRound} label="Full name" value={session.name} />
            <Fact
              icon={Building2}
              label="Organization"
              value={session.organization}
            />
            <Fact icon={ShieldCheck} label="Role" value={session.role} />
            <Fact
              icon={Mail}
              label="Verified email"
              value={authUser.email ?? "Email unavailable"}
            />
          </dl>
          <form
            action={signOut}
            className="mt-6 border-t border-[var(--border)] pt-6"
          >
            <button className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-bold text-[var(--error)] hover:border-[var(--error)] hover:bg-[var(--error-soft)]">
              <LogOut aria-hidden="true" className="size-4" />
              Sign out
            </button>
          </form>
        </CardContent>
      </Card>
      {session.role === "buyer" && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-[var(--success-soft)] text-[var(--primary)]">
                <Cable className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-[.1em] text-[var(--primary)]">
                  Business connections
                </p>
                <h2 className="mt-1 text-xl font-bold">Coupa</h2>
                {connection ? (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <CheckCircle2 className="size-4 text-[var(--primary)]" />
                    <span>
                      <b>Demo connection active</b> · Synthetic evidence only
                    </span>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    No Coupa connection is available. Applications use signed
                    buyer confirmation.
                  </p>
                )}
                {connection && (
                  <DemoConnectionControl
                    connectionId={connection.id}
                    scenario={connection.demo_scenario}
                  />
                )}
                <p className="mt-3 text-xs text-[var(--muted)]">
                  Live Coupa is unavailable until an authorised buyer sandbox
                  and read-only credentials are configured.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
