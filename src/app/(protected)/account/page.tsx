import { Building2, LogOut, Mail, ShieldCheck, UserRound } from "lucide-react";
import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole, requireUser } from "@/lib/auth/dal";
import { signOut } from "@/lib/auth/actions";

export const metadata: Metadata = { title: "Account" };

function Fact({ icon: Icon, label, value }: { icon: typeof UserRound; label: string; value: string }) {
  return <div className="flex gap-3 rounded-xl bg-[var(--soft)] p-4"><Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[var(--primary)]" /><div className="min-w-0"><dt className="text-xs font-semibold text-[var(--muted)]">{label}</dt><dd className="mt-1 break-words text-sm font-bold capitalize">{value}</dd></div></div>;
}

export default async function AccountPage() {
  const [session, authUser] = await Promise.all([requireRole(["sme", "buyer", "funder"]), requireUser()]);
  return (
    <div className="page-enter mx-auto max-w-3xl">
      <PageHeading eyebrow="Account" title="Your ProofFlow identity" description="These hosted identity details determine the organization and role used for every protected action." />
      <Card className="mt-10"><CardContent className="pt-6"><dl className="grid gap-3 sm:grid-cols-2"><Fact icon={UserRound} label="Full name" value={session.name} /><Fact icon={Building2} label="Organization" value={session.organization} /><Fact icon={ShieldCheck} label="Role" value={session.role} /><Fact icon={Mail} label="Verified email" value={authUser.email ?? "Email unavailable"} /></dl><form action={signOut} className="mt-6 border-t border-[var(--border)] pt-6"><button className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-bold text-[var(--error)] hover:border-[var(--error)] hover:bg-[var(--error-soft)]"><LogOut aria-hidden="true" className="size-4" />Sign out</button></form></CardContent></Card>
    </div>
  );
}
