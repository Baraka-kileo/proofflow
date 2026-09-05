import Link from "next/link";
import { CheckCircle2, CircleAlert, ShieldCheck, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";

export type BuyerSystemCheckView = {
  id: string;
  code: string;
  result: "pass" | "review" | "fail";
  title: string;
  explanation: string;
};

export function BuyerSystemEvidence({
  applicationId,
  outcome,
  checkedAt,
  checks,
  viewer,
}: {
  applicationId: string;
  outcome: string;
  checkedAt: string;
  checks: BuyerSystemCheckView[];
  viewer: "sme" | "buyer" | "funder";
}) {
  const status =
    outcome === "system_verified"
      ? "success"
      : outcome === "blocked"
        ? "error"
        : "review";
  const issues = checks.filter((check) => check.result !== "pass");
  const passed = checks.length - issues.length;
  const title =
    outcome === "system_verified"
      ? "Automated verification complete"
      : outcome === "blocked"
        ? "Application cannot proceed"
        : "Large customer review needed";
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-[.12em] text-[var(--primary)]">
              Automated verification
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-[-.03em]">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {outcome === "system_verified"
                ? "The purchase order, invoice, amount, delivery and payment status matched."
                : outcome === "blocked"
                  ? "customer system reports that this invoice is already paid."
                  : "customer system found a difference that needs the large customer’s attention."}
            </p>
          </div>
          <StatusBadge status={status}>
            {outcome === "system_verified"
              ? "Verified"
              : outcome === "blocked"
                ? "Blocked"
                : "Review needed"}
          </StatusBadge>
        </div>
        <dl className="mt-5 grid gap-2 sm:grid-cols-3">
          <Fact label="Source" value="customer system" />
          <Fact
            label="Result"
            value={`${passed} of ${checks.length} checks matched`}
          />
          <Fact
            label="Checked"
            value={`${new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Johannesburg" }).format(new Date(checkedAt))} SAST`}
          />
        </dl>
        {issues.length > 0 && (
          <div className="mt-4 space-y-2">
            {issues.map((check) => {
              const Icon = check.result === "fail" ? XCircle : CircleAlert;
              return (
                <div
                  key={check.id}
                  className={`flex gap-3 rounded-xl p-3 ${check.result === "fail" ? "bg-[var(--error-soft)]" : "bg-[var(--review-soft)]"}`}
                >
                  <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="text-sm font-bold">{check.title}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {check.explanation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {outcome === "system_verified" && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-[var(--success-soft)] p-3 text-sm font-semibold text-[var(--success)]">
            <CheckCircle2 aria-hidden="true" className="size-4" />
            No customer action is needed.
          </div>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={`/applications/${applicationId}/system-evidence`}
            className="inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] px-4 text-sm font-bold"
          >
            View verification details
          </Link>
          {outcome === "system_verified" && (
            <Link
              href={`/applications/${applicationId}/system-certificate`}
              target="_blank"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-bold text-white"
            >
              <ShieldCheck className="size-4" />
              Verification certificate
            </Link>
          )}
          {viewer === "buyer" && outcome === "review_required" && (
            <Link
              href={`/applications/${applicationId}/system-evidence`}
              className="inline-flex min-h-11 items-center rounded-xl bg-[var(--primary)] px-4 text-sm font-bold text-white"
            >
              Review differences
            </Link>
          )}
        </div>
        <p className="mt-4 text-xs text-[var(--muted)]">
          Recorded customer-system evidence. This result does not guarantee payment
          or approve funding.
        </p>
      </CardContent>
    </Card>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--soft)] p-3">
      <dt className="text-[11px] font-bold uppercase tracking-[.08em] text-[var(--muted)]">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold">{value}</dd>
    </div>
  );
}
