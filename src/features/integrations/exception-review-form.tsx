"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {
  resolveCoupaException,
  type ResolutionState,
} from "@/app/(protected)/applications/[applicationId]/system-evidence/actions";

const initial: ResolutionState = { status: "idle" };
export function ExceptionReviewForm({
  applicationId,
  checkId,
}: {
  applicationId: string;
  checkId: string;
}) {
  const [externalState, externalAction, externalPending] = useActionState(
    resolveCoupaException.bind(null, applicationId, "external_value"),
    initial,
  );
  const [supplierState, supplierAction, supplierPending] = useActionState(
    resolveCoupaException.bind(null, applicationId, "supplier_value"),
    initial,
  );
  const [issueState, issueAction, issuePending] = useActionState(
    resolveCoupaException.bind(null, applicationId, "other_issue"),
    initial,
  );
  const state = [externalState, supplierState, issueState].find(
    (item) => item.status !== "idle",
  );
  return (
    <div className="mt-4 space-y-3">
      {state && (
        <Alert
          tone={state.status === "error" ? "error" : "success"}
          title={state.status === "error" ? "Not saved" : "Saved"}
        >
          <p>{state.message}</p>
        </Alert>
      )}
      <div className="flex flex-wrap gap-2">
        <form action={externalAction}>
          <input type="hidden" name="checkId" value={checkId} />
          <Button type="submit" variant="secondary" loading={externalPending}>
            Confirm Coupa value
          </Button>
        </form>
        <form action={supplierAction}>
          <input type="hidden" name="checkId" value={checkId} />
          <Button type="submit" loading={supplierPending}>
            Confirm supplier value
          </Button>
        </form>
      </div>
      <form action={issueAction} className="space-y-2">
        <input type="hidden" name="checkId" value={checkId} />
        <label
          className="block text-xs font-bold"
          htmlFor={`explanation-${checkId}`}
        >
          Another issue
        </label>
        <textarea
          id={`explanation-${checkId}`}
          name="explanation"
          required
          minLength={3}
          maxLength={500}
          rows={2}
          className="w-full rounded-xl border border-[var(--border)] bg-white p-3 text-sm"
          placeholder="Briefly explain the issue"
        />
        <Button type="submit" variant="secondary" loading={issuePending}>
          Report another issue
        </Button>
      </form>
    </div>
  );
}
