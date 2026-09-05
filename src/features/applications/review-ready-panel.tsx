"use client";

import { FileCheck2, LockKeyhole } from "lucide-react";
import { useActionState } from "react";
import { startApplicationEvidenceEntry } from "@/app/(protected)/applications/[applicationId]/evidence-entry-actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ReviewReadyPanel({
  applicationId = "00000000-0000-4000-8000-000000000000",
}: {
  applicationId?: string;
}) {
  const [state, action, pending] = useActionState(
    startApplicationEvidenceEntry.bind(null, applicationId),
    { status: "idle" as const },
  );
  return (
    <Card className="border-[#bfddd2] bg-[var(--success-soft)]">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--surface)] text-[var(--primary)]">
              <FileCheck2 className="size-5" aria-hidden="true" />
            </span>
            <div>
              <span className="text-xs font-bold uppercase tracking-[.12em] text-[var(--primary)]">
                Next task · Evidence
              </span>
              <h2 className="mt-2 text-xl font-bold">
                Documents are ready for evidence entry
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-[var(--muted)]">
                Open each private document and enter the required values exactly
                as shown. ProofFlow will then run explainable, fixed rules.
              </p>
            </div>
          </div>
          <form action={action}>
            <Button type="submit" loading={pending}>
              {pending ? "Preparing fields…" : "Enter evidence details"}
            </Button>
          </form>
        </div>
        {state.status === "error" && (
          <Alert tone="error" title="Evidence entry needs attention" className="mt-5">
            <p>{state.message}</p>
          </Alert>
        )}
        <p className="mt-5 flex gap-2 border-t border-[#bfddd2] pt-4 text-xs text-[var(--muted)]">
          <LockKeyhole className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Verification stays locked until all required values are entered.
        </p>
      </CardContent>
    </Card>
  );
}
