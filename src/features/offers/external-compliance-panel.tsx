"use client";

import { ShieldCheck } from "lucide-react";
import { useActionState } from "react";
import { recordExternalComplianceStatus } from "@/app/(protected)/applications/[applicationId]/compliance-actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type Check = {
  status: string;
  provider_name: string | null;
  external_reference: string | null;
  completed_at: string | null;
  expires_at: string | null;
} | null;

export function ExternalCompliancePanel({ applicationId, check }: { applicationId: string; check: Check }) {
  const [state, action, pending] = useActionState(
    recordExternalComplianceStatus.bind(null, applicationId),
    { status: "idle" as const },
  );
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--success-soft)] text-[var(--primary)]">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <div>
            <span className="text-xs font-bold uppercase tracking-[.12em] text-[var(--primary)]">Funding partner responsibility</span>
            <h2 className="mt-2 text-xl font-bold">External KYC/KYB progress</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              Identity and compliance checks are completed by the selected funding partner or its approved provider.
              ProofFlow displays the progress but does not make the compliance decision.
            </p>
          </div>
        </div>
        <form action={action} className="mt-5 grid gap-4 md:grid-cols-3">
          <label className="text-sm font-bold">Status
            <Select name="status" className="mt-2" defaultValue={check?.status ?? "required"}>
              <option value="required">Required</option>
              <option value="in_progress">In progress</option>
              <option value="additional_information_required">Additional information required</option>
              <option value="completed">Completed</option>
              <option value="unable_to_verify">Unable to verify</option>
              <option value="expired">Expired</option>
            </Select>
          </label>
          <label className="text-sm font-bold">Provider
            <Input name="providerName" className="mt-2" maxLength={120} defaultValue={check?.provider_name ?? ""} placeholder="Funding partner or approved provider" />
          </label>
          <label className="text-sm font-bold">External reference
            <Input name="externalReference" className="mt-2" maxLength={160} defaultValue={check?.external_reference ?? ""} placeholder="Reference only—no identity data" />
          </label>
          <div className="md:col-span-3 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
            <p className="text-xs text-[var(--muted)]">Do not enter ID numbers, biometrics, sanctions reports, or confidential compliance reasoning.</p>
            <Button type="submit" loading={pending}>{pending ? "Saving…" : "Save compliance status"}</Button>
          </div>
        </form>
        {state.status === "error" && <Alert tone="error" title="Status not saved" className="mt-4">{state.message}</Alert>}
        {state.status === "success" && <Alert tone="success" title="Status saved" className="mt-4">{state.message}</Alert>}
      </CardContent>
    </Card>
  );
}
