"use client";

import { FileText, LockKeyhole } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import { submitApplicationEvidence } from "@/app/(protected)/applications/[applicationId]/evidence-entry-actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ReviewField = {
  id: string;
  name: string;
normalizedValue: string | boolean | null;};
export type ReviewDocument = {
  id: string;
  kind: "purchase_order" | "delivery_evidence" | "invoice";
  filename: string;
  previewUrl: string | null;fields: ReviewField[];
};

const kindLabels = {
  purchase_order: "Purchase order",
  delivery_evidence: "Delivery evidence",
  invoice: "Invoice",
};
const fieldLabels: Record<string, string> = {
  buyer_legal_name: "Large customer legal name",
  supplier_legal_name: "Supplier legal name",
  purchase_order_reference: "PO reference",
  issue_date: "Issue date",
  currency: "Currency",
  order_total: "Order total",
  delivery_or_completion_date: "Delivery/completion date",
  receiver_or_signature_present: "Receiver or signature present",
  invoice_number: "Invoice number",
  due_date: "Due date",
  subtotal: "Subtotal",
  tax: "Tax",
  total: "Total",
};
const formatHints: Record<string, string> = {
  issue_date: "YYYY-MM-DD",
  delivery_or_completion_date: "YYYY-MM-DD",
  due_date: "YYYY-MM-DD",
  currency: "Three-letter currency code, for example ZAR",
  order_total: "Decimal amount, for example 48750.00",
  subtotal: "Decimal amount",
  tax: "Decimal amount",
  total: "Decimal amount",
};
const inputValue = (value: ReviewField["normalizedValue"]) =>
  value === null ? "" : typeof value === "boolean" ? (value ? "Yes" : "No") : value;

export function EvidenceEntryWorkspace({
  documents,
  applicationId = "00000000-0000-4000-8000-000000000000",
}: {
  documents: ReviewDocument[];
  applicationId?: string;
}) {
  const [selectedId, setSelectedId] = useState(documents[0]?.id ?? "");
  const [mobileView, setMobileView] = useState<"document" | "fields">("fields");
  const initial = useMemo(
    () =>
      Object.fromEntries(
        documents.flatMap((document) =>
          document.fields.map((field) => [field.id, inputValue(field.normalizedValue)]),
        ),
      ),
    [documents],
  );
  const [values, setValues] = useState<Record<string, string>>(initial);
  const selected = documents.find((document) => document.id === selectedId) ?? documents[0];
  const [state, submitAction, pending] = useActionState(
    submitApplicationEvidence.bind(null, applicationId),
    { status: "idle" as const },
  );
  const enteredFields = documents.flatMap((document) =>
    document.fields.map((field) => ({
      id: field.id,
      value:
        field.name === "receiver_or_signature_present"
          ? values[field.id] === "Yes"
          : (values[field.id] ?? "").trim(),
    })),
  );
  if (!selected) return null;

  return (
    <section aria-labelledby="evidence-fields-heading">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-[.12em] text-[var(--primary)]">
                SME declaration required
              </span>
              <h2 id="evidence-fields-heading" className="mt-2 text-2xl font-bold tracking-[-.03em]">
                Enter the evidence details
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                Read each private source document and type the values exactly as
                shown. No external processing service receives these documents.
              </p>
            </div>
            <span className="w-fit rounded-full bg-[var(--soft)] px-3 py-2 text-xs font-bold">
              {documents.reduce((sum, document) => sum + document.fields.length, 0)} required fields
            </span>
          </div>

          <div className="mt-6 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Evidence documents">
            {documents.map((document) => (
              <button
                key={document.id}
                type="button"
                role="tab"
                aria-selected={document.id === selected.id}
                onClick={() => setSelectedId(document.id)}
                className={cn(
                  "min-h-11 shrink-0 rounded-xl border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--focus)]",
                  document.id === selected.id
                    ? "border-[var(--primary)] bg-[var(--success-soft)] text-[var(--primary)]"
                    : "border-[var(--border)] bg-[var(--surface)]",
                )}
              >
                {kindLabels[document.kind]}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-[var(--soft)] p-1 xl:hidden">
            {(["document", "fields"] as const).map((view) => (
              <button
                key={view}
                type="button"
                aria-pressed={mobileView === view}
                onClick={() => setMobileView(view)}
                className={cn(
                  "min-h-11 rounded-lg text-sm font-semibold capitalize",
                  mobileView === view && "bg-[var(--surface)] shadow-sm",
                )}
              >
                {view}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-6 xl:grid-cols-2">
            <div className={cn("min-w-0", mobileView !== "document" && "hidden xl:block")}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold">{kindLabels[selected.kind]}</h3>
                  <p className="mt-1 break-all text-xs text-[var(--muted)]">{selected.filename}</p>
                </div>
                <span className="flex items-center gap-1 text-xs font-semibold text-[var(--primary)]">
                  <FileText className="size-4" aria-hidden="true" />
                  Private preview
                </span>
              </div>
              {selected.previewUrl ? (
                <iframe
                  src={selected.previewUrl}
                  title={`${kindLabels[selected.kind]} private preview`}
                  className="h-[620px] w-full rounded-xl border border-[var(--border)] bg-white"
                />
              ) : (
                <div className="grid min-h-72 place-items-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--soft)] p-6 text-center text-sm text-[var(--muted)]">
                  Preview expired or unavailable. Reload this private page to request a new signed preview.
                </div>
              )}
            </div>

            <div className={cn("space-y-4", mobileView !== "fields" && "hidden xl:block")}>
              {selected.fields.map((field) => (
                <div key={field.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <label htmlFor={`field-${field.id}`} className="text-sm font-bold">
                    {fieldLabels[field.name] ?? field.name}
                  </label>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Enter from the {kindLabels[selected.kind].toLowerCase()}.
                  </p>
                  {field.name === "receiver_or_signature_present" ? (
                    <select
                      id={`field-${field.id}`}
                      value={values[field.id] ?? ""}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, [field.id]: event.target.value }))
                      }
                      className="mt-3 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--focus)]"
                    >
                      <option value="">Choose an answer</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  ) : (
                    <input
                      id={`field-${field.id}`}
                      required
                      value={values[field.id] ?? ""}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, [field.id]: event.target.value }))
                      }
                      className="mt-3 min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--focus)]"
                    />
                  )}
                  {formatHints[field.name] && (
                    <p className="mt-2 text-[11px] text-[var(--muted)]">{formatHints[field.name]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {state.status === "error" && (
            <Alert tone="error" title="Evidence not saved" className="mt-6">
              <p>{state.message}</p>
            </Alert>
          )}
          {state.status === "success" && (
            <Alert tone="success" title="Evidence saved" className="mt-6">
              <p>{state.message}</p>
            </Alert>
          )}
          <form
            action={submitAction}
            className="sticky bottom-20 mt-6 flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_94%,transparent)] p-4 backdrop-blur md:bottom-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <input type="hidden" name="enteredFields" value={JSON.stringify(enteredFields)} />
            <p className="flex max-w-2xl gap-2 text-xs leading-5 text-[var(--muted)]">
              <LockKeyhole className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              By submitting, you declare that these values accurately reflect the
              uploaded documents. Your identity and submission time are recorded.
            </p>
            <Button type="submit" loading={pending}>
              {pending ? "Saving evidence…" : "Submit evidence details"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
