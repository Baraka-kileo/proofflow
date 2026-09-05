import { Building2, Landmark, ShieldCheck, Store } from "lucide-react";
import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Help" };

const roles = [
  { title: "SME supplier", text: "Creates the application, uploads private evidence, reviews extracted fields, and sends an explainable package to the buyer.", icon: Store },
  { title: "Buyer", text: "Answers six transaction questions, corrects any disagreement, and signs a declaration tied to a permanent confirmation receipt.", icon: Building2 },
  { title: "Funder", text: "Reads the evidence and buyer certificate, then records a clearly simulated offer or decline without changing source facts.", icon: Landmark },
];

export default async function HelpPage() {
  await requireRole(["sme", "buyer", "funder"]);
  return (
    <div className="page-enter mx-auto max-w-5xl">
      <PageHeading eyebrow="Help" title="One evidence trail, three clear roles." description="ProofFlow keeps each participant focused on the facts they are authorised to provide or review." />
      <section className="mt-10 grid gap-4 md:grid-cols-3" aria-label="ProofFlow roles">
        {roles.map(({ title, text, icon: Icon }) => <Card key={title}><CardContent className="pt-6"><span className="grid size-11 place-items-center rounded-xl bg-[var(--soft)] text-[var(--primary)]"><Icon aria-hidden="true" className="size-5" /></span><h2 className="mt-6 text-lg font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{text}</p></CardContent></Card>)}
      </section>
      <Alert tone="info" title="Privacy and simulation boundary" className="mt-6"><div className="flex gap-3"><ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0" /><p>Evidence is private and role-filtered. Demo identities and documents are synthetic. ProofFlow does not make a credit decision, create a guarantee, or move money.</p></div></Alert>
      <Card className="mt-6"><CardContent className="pt-6"><h2 className="text-lg font-bold">If something does not look right</h2><ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-6 text-[var(--muted)]"><li>Do not submit a decision you cannot support.</li><li>Use the visible correction, retry, or go-back action on the current screen.</li><li>If access is denied, return to Overview and confirm you entered the correct role workspace.</li></ol></CardContent></Card>
    </div>
  );
}
