"use client";

import { useActionState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  FileSearch,
  RefreshCw,
} from "lucide-react";
import {
  checkBuyerSystem,
  runApplicationVerification,
  type VerificationActionState,
} from "@/app/(protected)/applications/[applicationId]/verification-actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import type {
  VerificationCheck,
  VerificationStatus,
} from "@/lib/verification/rules-v1";

const initialState: VerificationActionState = { status: "idle" };
const icons = { pass: CheckCircle2, review: CircleAlert, fail: AlertCircle };

export function VerificationPanel({
  applicationId,
  status,
  overallResult,
  checks,
  completedAt,
  sourceDocuments,
}: {
  applicationId: string;
  status: string;
  overallResult: VerificationStatus | null;
  checks: VerificationCheck[];
  completedAt: string | null;
  sourceDocuments: Array<{ id: string; label: string }>;
}) {
  const [runState, runAction, running] = useActionState(
    runApplicationVerification.bind(null, applicationId),
    initialState,
  );
  const [systemState, systemAction, checking] = useActionState(
    checkBuyerSystem.bind(null, applicationId),
    initialState,
  );
  const hasRun = checks.length === 12 && overallResult !== null;
  const canCheck =
    [
      "checks_complete",
      "buyer_exception_review",
      "buyer_system_blocked",
    ].includes(status) && overallResult !== "fail";
  const automatedResultRecorded = [
    "buyer_system_verified",
    "buyer_exception_review",
    "buyer_system_blocked",
  ].includes(status);
  const pendingBuyer = status === "buyer_pending";
  const buyerDecided = [
    "buyer_confirmed",
    "buyer_disputed",
    "funder_review",
    "offer_made",
    "offer_accepted",
    "offer_declined",
    "funded_simulated",
  ].includes(status);

  if (!hasRun)
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="grid size-11 place-items-center rounded-xl bg-[var(--success-soft)] text-[var(--primary)]">
            <FileSearch className="size-5" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-2xl font-bold tracking-[-.03em]">
            Check your documents
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
            ProofFlow checks the names, references, dates, totals, delivery
            acknowledgement, and possible duplicates. It does not make a credit
            decision.
          </p>
          {runState.status === "error" && (
            <Alert tone="error" title="Checks not completed" className="mt-5">
              <p>{runState.message}</p>
            </Alert>
          )}
          <form action={runAction} className="mt-6">
            <Button type="submit" loading={running}>
              {running ? "Checking 12 items…" : "Check documents"}
            </Button>
          </form>
        </CardContent>
      </Card>
    );

  const displayedChecks =
    status === "buyer_system_verified"
      ? checks.filter((check) => check.ruleId !== "V012")
      : checks;
  const issues = displayedChecks.filter((check) => check.status !== "pass");
  const passed = displayedChecks.filter(
    (check) => check.status === "pass",
  ).length;
  const failed = issues.filter((check) => check.status === "fail").length;
  const review = issues.filter((check) => check.status === "review").length;
  const clear = issues.length === 0;

  return (
    <section aria-labelledby="document-checks-heading" className="space-y-5">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-[.12em] text-[var(--primary)]">
                Document checks
              </span>
              <h2
                id="document-checks-heading"
                className="mt-2 text-2xl font-bold tracking-[-.03em]"
              >
                {clear
                  ? "Documents look consistent"
                  : failed
                    ? "A document issue must be corrected"
                    : `${review} ${review === 1 ? "item needs" : "items need"} attention`}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {passed} checks passed
                {completedAt
                  ? ` · Checked ${new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(completedAt))}`
                  : ""}
              </p>
            </div>
            <StatusBadge
              status={clear ? "success" : failed ? "error" : "review"}
            >
              {clear ? "Clear" : failed ? "Correction needed" : "Review"}
            </StatusBadge>
          </div>
          {failed > 0 && (
            <Alert
              tone="error"
              title="Automated verification is blocked"
              className="mt-5"
            >
              <p>
                Correct the failed evidence and run the document checks again.
              </p>
            </Alert>
          )}
          {issues.length > 0 && (
            <div
              className="mt-5 space-y-2"
              aria-label="Items needing attention"
            >
              {issues.map((check) => (
                <CheckSummary key={check.ruleId} check={check} />
              ))}
            </div>
          )}
          <details
            className="group mt-5 border-t border-[var(--border)] pt-4"
            open={failed > 0}
          >
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg text-sm font-bold text-[var(--primary)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--focus)]">
              View all {displayedChecks.length} document checks
              <ChevronDown
                aria-hidden="true"
                className="size-4 transition-transform group-open:rotate-180"
              />
            </summary>
            <div className="mt-3 grid gap-3 xl:grid-cols-2">
              {displayedChecks.map((check) => (
                <DetailedCheck
                  key={check.ruleId}
                  check={check}
                  sourceDocuments={sourceDocuments}
                />
              ))}
            </div>
          </details>
        </CardContent>
      </Card>

      {(runState.status === "error" || systemState.status === "error") && (
        <Alert tone="error" title="Action not completed">
          <p>
            {runState.status === "error"
              ? runState.message
              : systemState.message}
          </p>
        </Alert>
      )}
      {systemState.status === "success" && (
        <Alert tone="success" title="Automated verification complete">
          <p>{systemState.message}</p>
        </Alert>
      )}

      {!automatedResultRecorded && !buyerDecided && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-[.1em] text-[var(--primary)]">
                  Next step
                </span>
                <h3 className="mt-1 text-lg font-bold">
                  {pendingBuyer
                    ? "Large customer signature requested"
                    : canCheck
                      ? "Run automated verification"
                      : "Correct the document issue first"}
                </h3>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                  {pendingBuyer
                    ? "Demo Coupa was unavailable, so the large customer received the six-question signature flow."
                    : canCheck
                      ? "ProofFlow will match the PO, invoice, amount, delivery and payment status against synthetic Demo Coupa records."
                      : "Automated verification becomes available when the document checks have no blocking failures."}
                </p>
              </div>
              {pendingBuyer ? (
                <StatusBadge status="review">Waiting for customer</StatusBadge>
              ) : (
                <form action={systemAction}>
                  <Button type="submit" loading={checking} disabled={!canCheck}>
                    <RefreshCw className="size-4" aria-hidden="true" />
                    {checking ? "Checking…" : "Run automated verification"}
                  </Button>
                </form>
              )}
            </div>
            {canCheck && (
              <p className="mt-4 text-xs text-[var(--muted)]">
                Demo Coupa · Synthetic evidence · No funding decision
              </p>
            )}
            {overallResult === "fail" && (
              <form action={runAction} className="mt-3">
                <button
                  type="submit"
                  disabled={running}
                  className="min-h-11 text-sm font-semibold text-[var(--primary)] underline-offset-4 hover:underline disabled:opacity-50"
                >
                  {running ? "Checking again…" : "Run document checks again"}
                </button>
              </form>
            )}
          </CardContent>
        </Card>
      )}
    </section>
  );
}

function CheckSummary({ check }: { check: VerificationCheck }) {
  const Icon = icons[check.status];
  return (
    <div
      className={`flex gap-3 rounded-xl p-3 ${check.status === "fail" ? "bg-[var(--error-soft)]" : "bg-[var(--review-soft)]"}`}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div>
        <p className="text-sm font-bold">{check.title}</p>
        <p className="mt-1 text-sm text-[var(--muted)]">{check.explanation}</p>
      </div>
    </div>
  );
}

function DetailedCheck({
  check,
  sourceDocuments,
}: {
  check: VerificationCheck;
  sourceDocuments: Array<{ id: string; label: string }>;
}) {
  const Icon = icons[check.status];
  const sources = sourceDocuments.filter((document) =>
    check.sourceDocumentIds.includes(document.id),
  );
  return (
    <div className="rounded-xl border border-[var(--border)] p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--soft)]">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold">
              {check.ruleId} · {check.title}
            </h3>
            <StatusBadge
              status={
                check.status === "pass"
                  ? "success"
                  : check.status === "review"
                    ? "review"
                    : "error"
              }
            >
              {check.status}
            </StatusBadge>
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {check.explanation}
          </p>
          <dl className="mt-3 grid gap-2 rounded-xl bg-[var(--soft)] p-3 sm:grid-cols-2">
            {Object.entries(check.comparedValues).map(([label, value]) => (
              <div key={label}>
                <dt className="text-[11px] font-bold uppercase tracking-[.08em] text-[var(--muted)]">
                  {label}
                </dt>
                <dd className="mt-1 break-words text-sm font-semibold">
                  {value ?? "Missing"}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {sources.length ? (
              sources.map((source) => (
                <a
                  key={source.id}
                  href={`#document-${source.id}`}
                  className="min-h-7 font-semibold text-[var(--primary)] underline-offset-4 hover:underline"
                >
                  View {source.label}
                </a>
              ))
            ) : (
              <span className="text-[var(--muted)]">
                Large customer confirmation record
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
