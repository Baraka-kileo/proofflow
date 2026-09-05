"use client";
import { useActionState } from "react";
import {
  changeDemoCoupaScenario,
  type ConnectionActionState,
} from "@/app/(protected)/account/actions";
import { Button } from "@/components/ui/button";
const initial: ConnectionActionState = { status: "idle" };
export function DemoConnectionControl({
  connectionId,
  scenario,
}: {
  connectionId: string;
  scenario: string;
}) {
  const [state, action, pending] = useActionState(
    changeDemoCoupaScenario.bind(null, connectionId),
    initial,
  );
  return (
    <form
      action={action}
      className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end"
    >
      <label className="text-sm font-bold">
        Demo result
        <select
          name="scenario"
          defaultValue={scenario}
          className="mt-2 block min-h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 font-normal"
        >
          <option value="match">Complete match</option>
          <option value="invoice_missing">Invoice missing</option>
          <option value="amount_mismatch">Amount mismatch</option>
          <option value="receipt_missing">Receipt missing</option>
          <option value="already_paid">Already paid</option>
          <option value="disconnected">Coupa disconnected</option>
        </select>
      </label>
      <Button type="submit" variant="secondary" loading={pending}>
        Save scenario
      </Button>
      {state.message && (
        <p
          role="status"
          className={`text-xs font-semibold ${state.status === "error" ? "text-[var(--error)]" : "text-[var(--success)]"}`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
