import {
  Building2,
  CalendarDays,
  CheckCircle2,
  FileCheck2,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeading } from "@/components/page-heading";
import { StatusBadge } from "@/components/status-badge";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import type { TrustPassportMetrics } from "@/lib/trust-passport/metrics";

const date = new Intl.DateTimeFormat("en-ZA", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Johannesburg",
});

function money(minor: number, currency: string) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

function ValueMetric({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof CheckCircle2;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <span className="grid size-10 place-items-center rounded-xl bg-[var(--success-soft)] text-[var(--success)]">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[.1em] text-[var(--muted)]">
          {label}
        </p>
        <strong className="mt-2 block text-3xl tracking-[-.04em]">
          {value}
        </strong>
        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{note}</p>
      </CardContent>
    </Card>
  );
}

export function TrustPassportView({
  data,
  organization,
}: {
  data: TrustPassportMetrics;
  organization: string;
}) {
  const currencyEntries = Object.entries(data.verifiedValueByCurrency);
  const hasHistory = data.history.length > 0;

  return (
    <div className="page-enter mx-auto max-w-6xl">
      <PageHeading
        eyebrow="Trust Passport"
        title={`${organization}'s verified history`}
        description="A source-linked record of what large customers have confirmed. Every number below comes from completed evidence in ProofFlow."
        action={
          <Link
            href="/applications/new"
            className="inline-flex min-h-12 items-center rounded-xl bg-[var(--primary)] px-4 text-sm font-bold text-white hover:bg-[var(--primary-pressed)]"
          >
            Add new evidence
          </Link>
        }
      />

      <Alert tone="info" title="Evidence profile, not a score" className="mt-8">
        <p>
          This is not a credit score or funding guarantee. It records completed
          large-customer confirmations and disputes without predicting
          creditworthiness.
        </p>
      </Alert>

      <section
        aria-label="Trust Passport metrics"
        className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <ValueMetric
          label="Customer confirmed"
          value={String(data.confirmedCount)}
          note="Completed confirmation receipts"
          icon={CheckCircle2}
        />
        <ValueMetric
          label="Disputed"
          value={String(data.disputedCount)}
          note="Preserved as part of the evidence history"
          icon={FileCheck2}
        />
        <ValueMetric
          label="Confirming customers"
          value={String(data.distinctBuyerCount)}
          note="Distinct large-customer organizations"
          icon={Building2}
        />
        <ValueMetric
          label="Verified invoice value"
          value={
            currencyEntries.length === 1
              ? money(currencyEntries[0][1], currencyEntries[0][0])
              : `${currencyEntries.length} currencies`
          }
          note={
            currencyEntries.length
              ? "Confirmed invoices with completed verification"
              : "No confirmed and verified invoice value yet"
          }
          icon={ShieldCheck}
        />
      </section>

      {currencyEntries.length > 1 && (
        <Card className="mt-4">
          <CardContent className="flex flex-wrap gap-3 pt-6">
            {currencyEntries.map(([currency, amount]) => (
              <span
                key={currency}
                className="rounded-full bg-[var(--soft)] px-3 py-2 text-sm font-bold"
              >
                {money(amount, currency)}
              </span>
            ))}
          </CardContent>
        </Card>
      )}

      <section className="mt-10" aria-labelledby="evidence-history-title">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-[.1em] text-[var(--primary)]">
              Source evidence
            </span>
            <h2
              id="evidence-history-title"
              className="mt-2 text-2xl font-bold tracking-tight"
            >
              Evidence timeline
            </h2>
          </div>
          {hasHistory && (
            <span className="text-sm text-[var(--muted)]">
              {data.history.length} completed{" "}
              {data.history.length === 1 ? "event" : "events"}
            </span>
          )}
        </div>

        {!hasHistory ? (
          <div className="mt-5">
            <EmptyState
              title="No completed customer evidence yet"
              description="Complete an application and receive a large-customer decision. Its signed confirmation or dispute will appear here automatically."
              action={{
                label: "Start an application",
                href: "/applications/new",
              }}
            />
          </div>
        ) : (
          <ol className="mt-5 space-y-4">
            {data.history.map((item) => (
              <li key={item.confirmationId}>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge
                            status={
                              item.confirmationStatus === "confirmed"
                                ? "success"
                                : "error"
                            }
                          >
                            {item.confirmationStatus === "confirmed"
                              ? "Customer confirmed"
                              : "Customer disputed"}
                          </StatusBadge>
                          {item.verificationResult && (
                            <span className="text-xs font-semibold capitalize text-[var(--muted)]">
                              Verification: {item.verificationResult}
                            </span>
                          )}
                        </div>
                        <h3 className="mt-4 text-lg font-bold">
                          {item.invoiceNumber ??
                            "Invoice reference unavailable"}
                        </h3>
                        <p className="mt-1 flex items-center gap-2 text-sm text-[var(--muted)]">
                          <UsersRound
                            aria-hidden="true"
                            className="size-4 shrink-0"
                          />
                          {item.buyerName}
                        </p>
                        <p className="mt-2 flex items-center gap-2 text-sm text-[var(--muted)]">
                          <CalendarDays
                            aria-hidden="true"
                            className="size-4 shrink-0"
                          />
                          {date.format(new Date(item.decidedAt))}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <Link
                          className="inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] px-4 text-sm font-bold hover:bg-[var(--soft)]"
                          href={item.applicationHref}
                        >
                          View application
                        </Link>
                        <Link
                          className="inline-flex min-h-11 items-center rounded-xl bg-[var(--primary)] px-4 text-sm font-bold text-white hover:bg-[var(--primary-pressed)]"
                          href={item.confirmationHref}
                        >
                          View customer receipt
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
