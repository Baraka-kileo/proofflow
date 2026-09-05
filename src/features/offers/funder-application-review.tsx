"use client";

import { useActionState, useMemo, useState } from "react";
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  Play,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { calculateOffer, parsePercentToBps } from "@/lib/offers/offer-v1";
import {
  createFundingProposal,
  declineApplication,
  startFunderReview,
  type OfferActionState,
} from "@/app/(protected)/applications/[applicationId]/offer-actions";

type DocumentReview = {
  id: string;
  label: string;
  filename: string;
  previewUrl: string | null;
  fields: Array<{ label: string; value: string }>;
};
type CheckReview = {
  code: string;
  result: "pass" | "review" | "fail";
  explanation: string;
};
type Props = {
  applicationId: string;
  status: string;
  supplier: string;
  buyer: string;
  invoice: string;
  purchaseOrder: string;
  invoiceMinor: number;
  currency: string;
  dueDate: string;
  documents: DocumentReview[];
  checks: CheckReview[];
  confirmation: {
    id: string;
    name: string;
    role: string;
    email: string;
    decidedAt: string;
    approvalId: string;
  } | null;
  audit: Array<{ id: string; label: string; time: string }>;
};
const initial: OfferActionState = { status: "idle" };

export function FunderApplicationReview(props: Props) {
  const workflowStatus =
    props.status === "buyer_system_verified" ? "buyer_confirmed" : props.status;
  const [reviewState, reviewAction, reviewPending] = useActionState(
    startFunderReview.bind(null, props.applicationId),
    initial,
  );
  const [offerState, offerAction, offerPending] = useActionState(
    createFundingProposal,
    initial,
  );
  const [declineState, declineAction, declinePending] = useActionState(
    declineApplication,
    initial,
  );
  const [advance, setAdvance] = useState("80");
  const [fee, setFee] = useState("2.5");
  const [expiry, setExpiry] = useState(defaultExpiry());
  const calculation = useMemo(() => {
    const advanceBps = parsePercentToBps(advance),
      feeBps = parsePercentToBps(fee);
    if (advanceBps === null || feeBps === null) return null;
    try {
      return calculateOffer(props.invoiceMinor, advanceBps, feeBps);
    } catch {
      return null;
    }
  }, [advance, fee, props.invoiceMinor]);
  const ready = workflowStatus === "funder_review";
  const decided = [
    "offer_made",
    "offer_accepted",
    "offer_declined",
    "funded_simulated",
  ].includes(workflowStatus);
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-[.12em] text-[var(--primary)]">
                  Read-only evidence package
                </span>
                <h2 className="mt-2 text-2xl font-bold">{props.supplier}</h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {props.invoice} · {money(props.invoiceMinor, props.currency)}{" "}
                  · due {formatDate(props.dueDate)}
                </p>
              </div>
              <StatusBadge status="success">
                {props.confirmation
                  ? "Large customer confirmed ✓"
                  : "Customer records verified ✓"}
              </StatusBadge>
            </div>
            <dl className="mt-6 grid gap-3 rounded-xl bg-[var(--soft)] p-4 sm:grid-cols-3">
              <Fact label="Large customer" value={props.buyer} />
              <Fact label="Purchase order" value={props.purchaseOrder} />
              <Fact label="Payment due" value={formatDate(props.dueDate)} />
            </dl>
          </CardContent>
        </Card>
        {props.confirmation && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.1em] text-[var(--success)]">
                    <ShieldCheck className="size-4" />
                    Signed customer confirmation
                  </span>
                  <h2 className="mt-3 text-xl font-bold">
                    {props.confirmation.name}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {props.confirmation.role} · {props.confirmation.email}
                  </p>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    Signed {formatTime(props.confirmation.decidedAt)} · Approval{" "}
                    {props.confirmation.approvalId}
                  </p>
                </div>
                <Link
                  href={`/confirmations/${props.confirmation.id}`}
                  className="inline-flex min-h-11 items-center gap-2 self-start rounded-xl border border-[var(--border)] px-4 text-sm font-bold text-[var(--primary)]"
                >
                  Open signed receipt
                  <ExternalLink className="size-4" />
                </Link>
              </div>
              <Link
                href={`/confirmations/${props.confirmation.id}/certificate`}
                target="_blank"
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-bold text-white"
              >
                <FileCheck2 className="size-4" />
                View Confirmation Certificate
              </Link>
            </CardContent>
          </Card>
        )}
        <section>
          <div className="flex items-end justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-[.12em] text-[var(--primary)]">
                12 transparent document checks
              </span>
              <h2 className="mt-2 text-xl font-bold">
                Why this package is ready
              </h2>
            </div>
            <StatusBadge
              status={
                props.checks.some((c) => c.result !== "pass")
                  ? "review"
                  : "success"
              }
            >
              {props.checks.filter((c) => c.result !== "pass").length} review
              items
            </StatusBadge>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {props.checks.map((check) => (
              <Card key={check.code}>
                <CardContent className="pt-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2
                      className={`mt-0.5 size-5 shrink-0 ${check.result === "pass" ? "text-[var(--success)]" : "text-[var(--review)]"}`}
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <b>{check.code}</b>
                        <StatusBadge
                          status={
                            check.result === "pass"
                              ? "success"
                              : check.result === "review"
                                ? "review"
                                : "error"
                          }
                        >
                          {check.result}
                        </StatusBadge>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                        {check.explanation}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        <section>
          <span className="text-xs font-bold uppercase tracking-[.12em] text-[var(--primary)]">
            Source evidence
          </span>
          <h2 className="mt-2 text-xl font-bold">
            Reviewed documents and fields
          </h2>
          {props.documents.length ? (
            <div className="mt-4 space-y-3">
              {props.documents.map((document) => (
                <details
                  key={document.id}
                  className="rounded-2xl border border-[var(--border)] bg-white p-5"
                >
                  <summary className="cursor-pointer list-none font-bold">
                    <span>{document.label}</span>
                    <span className="ml-2 text-xs font-normal text-[var(--muted)]">
                      {document.filename}
                    </span>
                  </summary>
                  <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
                    <dl className="grid gap-2 sm:grid-cols-2">
                      {document.fields.map((field) => (
                        <Fact
                          key={field.label}
                          label={field.label}
                          value={field.value}
                        />
                      ))}
                    </dl>
                    {document.previewUrl ? (
                      <a
                        href={document.previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-bold"
                      >
                        Open private preview
                        <ExternalLink className="size-4" />
                      </a>
                    ) : (
                      <span className="text-xs text-[var(--muted)]">
                        Preview unavailable
                      </span>
                    )}
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <Alert title="Source file previews unavailable">
              <p>
                This historical record preserves the reviewed values but does
                not include source-file previews. New applications show all
                three private previews and reviewed fields here.
              </p>
            </Alert>
          )}
        </section>
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold">Audit timeline</h2>
            <ul className="mt-4 space-y-3">
              {props.audit.map((event) => (
                <li
                  key={event.id}
                  className="flex justify-between gap-4 border-b border-[var(--border)] pb-3 text-sm"
                >
                  <b>{event.label}</b>
                  <span className="text-[var(--muted)]">
                    {formatTime(event.time)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      <aside className="xl:sticky xl:top-24 xl:self-start">
        <Card>
          <CardContent className="pt-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--review-soft)] px-3 py-1 text-xs font-bold text-[var(--review)]">
              <Calculator className="size-4" />
              Independent funder decision
            </span>
            <h2 className="mt-4 text-2xl font-bold">
              Funding proposal
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              The funder remains responsible for compliance, underwriting, approval, contracting and disbursement.
            </p>
            {reviewState.status === "error" && (
              <Alert tone="error" title="Review not started" className="mt-4">
                <p>{reviewState.message}</p>
              </Alert>
            )}
            {workflowStatus === "buyer_confirmed" && (
              <form action={reviewAction} className="mt-5">
                <Button
                  type="submit"
                  loading={reviewPending}
                  className="w-full"
                >
                  <Play className="size-4" />
                  Start funder review
                </Button>
              </form>
            )}
            {ready && (
              <>
                <form action={offerAction} className="mt-5 space-y-4">
                  <input
                    type="hidden"
                    name="applicationId"
                    value={props.applicationId}
                  />
                  <Input
                    label="Advance percentage"
                    suffix="%"
                    name="advancePercent"
                    value={advance}
                    onChange={setAdvance}
                    error={offerState.fieldErrors?.advancePercent}
                  />
                  <Input
                    label="Fee on advance"
                    suffix="%"
                    name="feePercent"
                    value={fee}
                    onChange={setFee}
                    error={offerState.fieldErrors?.feePercent}
                  />
                  <Input
                    label="Offer expires"
                    name="expiryDate"
                    type="date"
                    value={expiry}
                    onChange={setExpiry}
                    error={offerState.fieldErrors?.expiryDate}
                  />
                  {calculation ? (
                    <dl className="space-y-3 rounded-xl bg-[var(--soft)] p-4">
                      <FactRow
                        label="Invoice value"
                        value={money(calculation.invoiceMinor, props.currency)}
                      />
                      <FactRow
                        label="Gross advance"
                        value={money(
                          calculation.advanceAmountMinor,
                          props.currency,
                        )}
                      />
                      <FactRow
                        label="Fee"
                        value={money(
                          calculation.feeAmountMinor,
                          props.currency,
                        )}
                      />
                      <FactRow
                        label="Net disbursement"
                        value={money(
                          calculation.netDisbursementMinor,
                          props.currency,
                        )}
                        strong
                      />
                      <FactRow
                        label="Large customer pays supplier"
                        value={formatDate(props.dueDate)}
                      />
                    </dl>
                  ) : (
                    <Alert tone="error" title="Terms cannot be calculated">
                      <p>Use valid percentages within the allowed range.</p>
                    </Alert>
                  )}
                  {offerState.status === "error" && (
                    <Alert tone="error" title="Offer not saved">
                      <p>{offerState.message}</p>
                    </Alert>
                  )}
                  <Button
                    type="submit"
                    className="w-full"
                    loading={offerPending}
                    disabled={!calculation}
                  >
                    Create funding proposal
                  </Button>
                </form>
                <details className="mt-4 rounded-xl border border-[#efc6c2] p-4">
                  <summary className="cursor-pointer text-sm font-bold text-[var(--error)]">
                    Decline this application
                  </summary>
                  <form action={declineAction} className="mt-4">
                    <input
                      type="hidden"
                      name="applicationId"
                      value={props.applicationId}
                    />
                    <label
                      htmlFor="funder-decline-reason"
                      className="text-sm font-bold"
                    >
                      Reason
                    </label>
                    <textarea
                      id="funder-decline-reason"
                      name="reason"
                      rows={3}
                      maxLength={500}
                      className="mt-2 w-full rounded-xl border border-[var(--border)] p-3 text-sm"
                      placeholder="Explain the decision to the supplier."
                    />
                    {declineState.status === "error" && (
                      <p className="mt-2 text-xs font-bold text-[var(--error)]">
                        {declineState.fieldErrors?.reason ??
                          declineState.message}
                      </p>
                    )}
                    <Button
                      type="submit"
                      variant="danger"
                      className="mt-3 w-full"
                      loading={declinePending}
                    >
                      <AlertTriangle className="size-4" />
                      Record decline
                    </Button>
                  </form>
                </details>
              </>
            )}
            {decided && (
              <Alert
                tone="success"
                title="Decision already recorded"
                className="mt-5"
              >
                <p>
                  Open the funding proposal receipt from the dashboard or
                  supplier application.
                </p>
              </Alert>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-[var(--muted)]">{label}</dt>
      <dd className="mt-1 break-words text-sm font-bold">{value}</dd>
    </div>
  );
}
function FactRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-sm text-[var(--muted)]">{label}</dt>
      <dd
        className={
          strong
            ? "text-base font-extrabold text-[var(--primary)]"
            : "text-sm font-bold"
        }
      >
        {value}
      </dd>
    </div>
  );
}
function Input({
  label,
  name,
  value,
  onChange,
  suffix,
  type = "text",
  error,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  type?: string;
  error?: string;
}) {
  return (
    <label className="block text-sm font-bold">
      {label}
      <span className="relative mt-2 block">
        <input
          name={name}
          type={type}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 pr-9 font-normal focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--focus)]"
        />
        {suffix && (
          <span className="absolute right-3 top-3 text-[var(--muted)]">
            {suffix}
          </span>
        )}
      </span>
      {error && (
        <span className="mt-1 block text-xs text-[var(--error)]">{error}</span>
      )}
    </label>
  );
}
function money(minor: number, currency: string) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(minor / 100);
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeZone: "Africa/Johannesburg",
  }).format(new Date(`${value}T12:00:00+02:00`));
}
function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Johannesburg",
  }).format(new Date(value));
}
function defaultExpiry() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}
