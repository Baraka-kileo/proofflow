import type { SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/page-heading";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { ExceptionReviewForm } from "@/features/integrations/exception-review-form";
import { requireApplicationAccess } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export default async function SystemEvidencePage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { application, session } = await requireApplicationAccess(
    (await params).applicationId,
  );
  const db = (await createClient()) as unknown as SupabaseClient;
  const { data: run } = await db
    .from("integration_sync_runs")
    .select(
      "id,outcome,completed_at,correlation_id,integration_checks(id,rule_code,result,title,explanation,evidence,integration_exception_resolutions(id,choice,resolved_at)),external_evidence_snapshots(provider,provider_mode,payload_hash,retrieved_at,canonical_evidence)",
    )
    .eq("application_id", application.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!run) notFound();
  const snapshot = Array.isArray(run.external_evidence_snapshots)
    ? run.external_evidence_snapshots[0]
    : run.external_evidence_snapshots;
  const checks = Array.isArray(run.integration_checks)
    ? run.integration_checks
    : [];
  const exceptions = checks.filter((check) => check.result !== "pass");
  const passedChecks = checks.filter((check) => check.result === "pass");
  const canonical = snapshot?.canonical_evidence as
    Record<string, unknown> | undefined;
  const externalPo = canonical?.purchaseOrder as
    Record<string, unknown> | undefined;
  const externalInvoice = canonical?.invoice as
    Record<string, unknown> | undefined;
  return (
    <div className="page-enter mx-auto max-w-5xl">
      <Link
        href={
          session.role === "buyer"
            ? "/confirmations"
            : `/applications/${application.id}`
        }
        className="text-sm font-bold text-[var(--primary)]"
      >
        ← Back
      </Link>
      <div className="mt-5">
        <PageHeading
          eyebrow="Automated verification · Demo Coupa"
          title={
            run.outcome === "system_verified"
              ? "Verification details"
              : "Review the differences"
          }
          description="The important result appears first. Open the full check list only when you need the technical audit detail."
        />
      </div>
      <Card className="mt-8">
        <CardContent className="pt-6">
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Fact label="Source" value="Demo Coupa" />
            <Fact
              label="Checked"
              value={new Date(run.completed_at).toLocaleString("en-ZA", {
                timeZone: "Africa/Johannesburg",
              })}
            />
            <Fact label="Correlation ID" value={run.correlation_id} />
            <Fact
              label="Evidence hash"
              value={snapshot?.payload_hash ?? "Unavailable"}
            />
          </dl>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <Fact
              label="External PO reference"
              value={String(externalPo?.externalId ?? "Not found")}
            />
            <Fact
              label="External invoice reference"
              value={String(externalInvoice?.externalId ?? "Not found")}
            />
          </dl>
        </CardContent>
      </Card>
      {exceptions.length > 0 && (
        <section className="mt-6" aria-labelledby="differences-heading">
          <h2 id="differences-heading" className="text-xl font-bold">
            {exceptions.length}{" "}
            {exceptions.length === 1 ? "difference" : "differences"} found
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Only these items need attention.
          </p>
          <div className="mt-3 space-y-3">
            {exceptions.map((check) => {
              const resolved = Array.isArray(
                check.integration_exception_resolutions,
              )
                ? check.integration_exception_resolutions[0]
                : check.integration_exception_resolutions;
              return (
                <Card key={check.id}>
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-bold">
                          {check.rule_code} · {check.title}
                        </h2>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {check.explanation}
                        </p>
                      </div>
                      <StatusBadge
                        status={
                          check.result === "pass"
                            ? "success"
                            : check.result === "fail"
                              ? "error"
                              : "review"
                        }
                      >
                        {check.result}
                      </StatusBadge>
                    </div>
                    {check.evidence && typeof check.evidence === "object" && (
                      <dl className="mt-4 grid gap-2 rounded-xl bg-[var(--soft)] p-3 sm:grid-cols-2">
                        {Object.entries(check.evidence).map(([key, value]) => (
                          <div key={key}>
                            <dt className="text-[11px] font-bold uppercase tracking-[.06em] text-[var(--muted)]">
                              {key.replaceAll(/([A-Z])/g, " $1")}
                            </dt>
                            <dd className="mt-1 break-words text-sm font-semibold">
                              {formatEvidenceValue(value)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    {resolved && (
                      <p className="mt-3 text-sm font-semibold text-[var(--primary)]">
                        Resolved: {String(resolved.choice).replaceAll("_", " ")}
                      </p>
                    )}
                    {session.role === "buyer" &&
                      application.status === "buyer_exception_review" &&
                      check.result === "review" &&
                      !resolved && (
                        <ExceptionReviewForm
                          applicationId={application.id}
                          checkId={check.id}
                        />
                      )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}
      <details className="group mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-bold text-[var(--primary)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--focus)]">
          View all {checks.length} automated checks
          <span className="text-sm font-semibold text-[var(--muted)]">
            {passedChecks.length} passed
          </span>
        </summary>
        <div className="mt-4 space-y-3 border-t border-[var(--border)] pt-4">
          {checks.map((check) => (
            <CompactCheck
              key={check.id}
              code={check.rule_code}
              title={check.title}
              explanation={check.explanation}
              result={check.result}
            />
          ))}
        </div>
      </details>
      {run.outcome === "system_verified" && (
        <Link
          href={`/applications/${application.id}/system-certificate`}
          target="_blank"
          className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[var(--primary)] px-4 text-sm font-bold text-white"
        >
          View verification certificate
        </Link>
      )}
    </div>
  );
}
function CompactCheck({
  code,
  title,
  explanation,
  result,
}: {
  code: string;
  title: string;
  explanation: string;
  result: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl bg-[var(--soft)] p-3">
      <div>
        <p className="text-sm font-bold">
          {code} · {title}
        </p>
        <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
          {explanation}
        </p>
      </div>
      <StatusBadge
        status={
          result === "pass" ? "success" : result === "fail" ? "error" : "review"
        }
      >
        {result}
      </StatusBadge>
    </div>
  );
}
function formatEvidenceValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "Missing";
  if (typeof value === "number") return value.toLocaleString("en-ZA");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return typeof value === "string" ? value : "Recorded";
}
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-[var(--soft)] p-3">
      <dt className="text-xs font-bold text-[var(--muted)]">{label}</dt>
      <dd className="mt-1 break-all text-sm font-semibold">{value}</dd>
    </div>
  );
}
