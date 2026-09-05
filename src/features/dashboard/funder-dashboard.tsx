import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeading } from "@/components/page-heading";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardData } from "@/lib/dashboard/repository";
import { Metrics, QueueButton } from "./shared";

type FunderData = Extract<DashboardData, { role: "funder" }>;

export function FunderDashboard({ data }: { data: FunderData }) {
  const count = data.applications.length;
  return (
    <div className="page-enter mx-auto max-w-6xl">
      <PageHeading
        eyebrow="Funder / Bank overview"
        title={
          count
            ? `${count} ${count === 1 ? "application is" : "applications are"} ready.`
            : "No applications are waiting."
        }
        description="Review evidence first, then record a funding decision."
      />
      <Metrics items={data.metrics} />
      <section
        aria-label="Funder tasks"
        className="mt-8 grid gap-4 md:grid-cols-2"
      >
        <TaskCard
          title="Applications"
          description="Open customer-evidenced packages."
          count={`${count} ready`}
          href="/applications"
          action="Review applications"
        />
        <TaskCard
          title="Offers"
          description="View funding proposals and declines."
          count={`${data.offers.length} decisions`}
          href="/offers"
          action="View offers"
        />
      </section>
    </div>
  );
}

export function FunderApplicationsView({ data }: { data: FunderData }) {
  const count = data.applications.length;
  return (
    <div className="page-enter mx-auto max-w-5xl">
      <PageHeading
        eyebrow="Funder / Bank"
        title="Applications"
        description="Only packages with completed large-customer evidence appear here."
      />
      <Card className="mt-8">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold">Ready for review</h2>
            <StatusBadge status="success">{count} ready</StatusBadge>
          </div>
          {count ? (
            <FunderApplicationList data={data} />
          ) : (
            <EmptyState
              title="Nothing to review"
              description="Customer-confirmed applications will appear here."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function FunderOffersView({ data }: { data: FunderData }) {
  return (
    <div className="page-enter mx-auto max-w-5xl">
      <PageHeading
        eyebrow="Funder / Bank"
        title="Offers"
        description="Your recorded funding proposals and declines."
      />
      <Card className="mt-8">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold">Decision history</h2>
            <StatusBadge status="neutral">
              {data.offers.length} total
            </StatusBadge>
          </div>
          {data.offers.length ? (
            <FunderOfferList data={data} />
          ) : (
            <EmptyState
              title="No decisions yet"
              description="Decisions will appear after evidence review."
            />
          )}
        </CardContent>
      </Card>
      <p className="mt-4 text-xs text-[var(--muted)]">
        Funding partners remain responsible for compliance, underwriting, contracting and disbursement.
      </p>
    </div>
  );
}

function TaskCard({
  title,
  description,
  count,
  href,
  action,
}: {
  title: string;
  description: string;
  count: string;
  href: string;
  action: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{description}</p>
          </div>
          <StatusBadge status="neutral">{count}</StatusBadge>
        </div>
        <Link
          href={href}
          className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[var(--primary)] px-4 text-sm font-bold text-white hover:bg-[var(--primary-pressed)]"
        >
          {action}
        </Link>
      </CardContent>
    </Card>
  );
}

function FunderApplicationList({ data }: { data: FunderData }) {
  return (
    <div className="mt-6 divide-y divide-[var(--border)]">
      {data.applications.map((application) => (
        <article
          key={application.id}
          className="grid gap-4 py-5 lg:grid-cols-[1fr_auto] lg:items-center"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <b>{application.supplier}</b>
              <StatusBadge status="success">
                {application.buyerEvidence === "system"
                  ? "Automated verification ✓"
                  : "Large customer confirmed ✓"}
              </StatusBadge>
              <StatusBadge status={application.warnings ? "review" : "success"}>
                {application.warnings
                  ? `${application.warnings} ${application.warnings === 1 ? "review item" : "review items"}`
                  : "Checks clear"}
              </StatusBadge>
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {application.buyer} · {application.amount} · Due{" "}
              {application.dueDate} · Confirmed {application.confirmed}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <QueueButton label="Review evidence" href={application.href} />
            <QueueButton
              label={
                application.certificateHref ? "Certificate" : "Unavailable"
              }
              href={application.certificateHref ?? undefined}
            />
          </div>
        </article>
      ))}
    </div>
  );
}

function FunderOfferList({ data }: { data: FunderData }) {
  return (
    <div className="mt-6 divide-y divide-[var(--border)]">
      {data.offers.map((offer) => (
        <article
          key={offer.id}
          className="grid gap-4 py-5 lg:grid-cols-[1fr_auto] lg:items-center"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <b>{offer.supplier}</b>
              <StatusBadge
                status={offer.kind === "offer" ? "success" : "error"}
              >
                {offer.kind === "offer" ? offer.status : "declined"}
              </StatusBadge>
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {offer.invoice} · {offer.buyer} · Net {offer.net} ·{" "}
              {offer.created}
            </p>
          </div>
          <QueueButton label="View decision" href={offer.href} />
        </article>
      ))}
    </div>
  );
}
