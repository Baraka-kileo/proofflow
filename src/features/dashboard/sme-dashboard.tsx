import { Clock3, FileText } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeading } from "@/components/page-heading";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { DashboardData } from "@/lib/dashboard/repository";
import { Metrics, QueueButton } from "./shared";

export function SmeDashboard({
  data,
}: {
  data: Extract<DashboardData, { role: "sme" }>;
}) {
  return (
    <div className="page-enter mx-auto max-w-6xl">
      <PageHeading
        eyebrow="SME overview"
        title="Good morning, Amara."
        description="See your next step and keep each application moving."
        action={
          <Link
            href="/applications/new"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--primary-pressed)]"
          >
            Start application
          </Link>
        }
      />
      <Metrics items={data.metrics} />
      <section className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
        <Card>
          <CardContent className="pt-6">
            {data.application ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-[.1em] text-[var(--primary)]">
                      Current application
                    </span>
                    <h2 className="mt-2 text-2xl font-bold tracking-tight">
                      {data.application.buyer}
                    </h2>
                  </div>
                  <StatusBadge
                    status={applicationStatusTone(data.application.status)}
                  >
                    {data.application.status}
                  </StatusBadge>
                </div>
                <div className="mt-7 grid grid-cols-2 gap-3 rounded-xl bg-[var(--soft)] p-4 text-sm">
                  <span>
                    <small className="block text-[var(--muted)]">
                      Reference
                    </small>
                    <b>{data.application.id}</b>
                  </span>
                  <span>
                    <small className="block text-[var(--muted)]">
                      Invoice value
                    </small>
                    <b>{data.application.amount}</b>
                  </span>
                </div>
                <Progress
                  className="mt-7"
                  label="Evidence journey"
                  value={data.application.progress}
                />
                <div className="mt-6 flex items-center justify-between gap-4">
                  <p className="flex items-center gap-2 text-sm text-[var(--muted)]">
                    <Clock3 className="size-4" />
                    {data.application.next}
                  </p>
                  <QueueButton
                    label="View application"
                    href={data.application.href}
                  />
                </div>
              </>
            ) : (
              <EmptyState
                title="No applications yet"
                description="Your first application will appear here after you start it."
              />
            )}
          </CardContent>
        </Card>
        <Card className="bg-[var(--primary-pressed)] text-white">
          <CardContent className="pt-6">
            <FileText className="size-6 text-[#9fd4c5]" />
            <h2 className="mt-10 text-2xl font-semibold tracking-tight">
              Your proof is reusable.
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#c7d9d3]">
              Every customer-confirmed application adds explainable evidence to
              your Trust Passport—not an opaque credit score.
            </p>
            <Link
              href="/trust-passport"
              className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-white px-4 text-sm font-bold text-[var(--primary-pressed)] hover:bg-[var(--soft)]"
            >
              View Trust Passport
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export function SmeApplicationsView({
  data,
}: {
  data: Extract<DashboardData, { role: "sme" }>;
}) {
  return (
    <div className="page-enter mx-auto max-w-5xl">
      <PageHeading
        eyebrow="SME"
        title="Applications"
        description="Continue an application or start a new one."
        action={
          <Link
            href="/applications/new"
            className="inline-flex min-h-11 items-center rounded-xl bg-[var(--primary)] px-4 text-sm font-bold text-white hover:bg-[var(--primary-pressed)]"
          >
            Start application
          </Link>
        }
      />
      <Card className="mt-8">
        <CardContent className="pt-6">
          {data.applications.length ? (
            <div className="divide-y divide-[var(--border)]">
              {data.applications.map((application) => (
                <article
                  key={application.id}
                  className="grid gap-4 py-5 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <b>{application.invoice}</b>
                      <StatusBadge
                        status={applicationStatusTone(application.status)}
                      >
                        {application.status}
                      </StatusBadge>
                    </div>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {application.buyer} · {application.amount} ·{" "}
                      {application.id}
                    </p>
                  </div>
                  <QueueButton
                    label="Open application"
                    href={application.href}
                  />
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No applications yet"
              description="Start your first evidence application."
              action={{ label: "Start application", href: "/applications/new" }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function applicationStatusTone(
  status: string,
): "success" | "review" | "error" | "neutral" {
  const value = status.toLowerCase();
  if (
    value.includes("declined") ||
    value.includes("disputed") ||
    value.includes("cannot proceed") ||
    value.includes("failed")
  )
    return "error";
  if (
    value.includes("review") ||
    value.includes("pending") ||
    value.includes("waiting") ||
    value.includes("checking") ||
    value.includes("offer ready")
  )
    return "review";
  if (
    value.includes("verified") ||
    value.includes("complete") ||
    value.includes("confirmed") ||
    value.includes("funded") ||
    value.includes("accepted")
  )
    return "success";
  return "neutral";
}
