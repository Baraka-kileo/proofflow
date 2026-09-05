import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeading } from "@/components/page-heading";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardData } from "@/lib/dashboard/repository";
import { Metrics, QueueButton } from "./shared";

type BuyerData = Extract<DashboardData, { role: "buyer" }>;

export function BuyerDashboard({ data }: { data: BuyerData }) {
  const count = data.requests.length;
  return (
    <div className="page-enter mx-auto max-w-6xl">
      <PageHeading
        eyebrow="Buyer overview"
        title={count ? `${count} ${count === 1 ? "confirmation" : "confirmations"} waiting.` : "You are up to date."}
        description="Review new requests or open your past decisions."
      />
      <Metrics items={data.metrics} />
      <section aria-label="Buyer tasks" className="mt-8 grid gap-4 md:grid-cols-2">
        <TaskCard
          title="Confirmations"
          description={count ? "Start with the oldest request." : "There are no requests waiting."}
          count={`${count} pending`}
          href="/confirmations"
          action={count ? "Review confirmations" : "Open confirmations"}
        />
        <TaskCard
          title="History"
          description="View completed confirmations and disputes."
          count={`${data.history.length} decisions`}
          href="/confirmations/history"
          action="View history"
        />
      </section>
    </div>
  );
}

export function BuyerConfirmationsView({ data }: { data: BuyerData }) {
  const count = data.requests.length;
  return (
    <div className="page-enter mx-auto max-w-5xl">
      <PageHeading
        eyebrow="Buyer"
        title="Confirmations"
        description={count ? "Review one request at a time, starting with the oldest." : "You have no requests waiting."}
      />
      <Card className="mt-8">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold">Waiting for you</h2>
            <StatusBadge status={count ? "review" : "success"}>{count} pending</StatusBadge>
          </div>
          {count ? <BuyerRequestList data={data} /> : <EmptyState title="Nothing to confirm" description="New buyer requests will appear here." />}
        </CardContent>
      </Card>
    </div>
  );
}

export function BuyerHistoryView({ data }: { data: BuyerData }) {
  return (
    <div className="page-enter mx-auto max-w-5xl">
      <PageHeading eyebrow="Buyer" title="Decision history" description="Completed confirmations and disputes are read-only." />
      <Card className="mt-8">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold">Past decisions</h2>
            <StatusBadge status="neutral">{data.history.length} total</StatusBadge>
          </div>
          {data.history.length ? <BuyerHistoryList data={data} /> : <EmptyState title="No past decisions" description="Completed decisions will appear here." />}
        </CardContent>
      </Card>
    </div>
  );
}

function TaskCard({ title, description, count, href, action }: { title: string; description: string; count: string; href: string; action: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div><h2 className="text-xl font-bold">{title}</h2><p className="mt-2 text-sm text-[var(--muted)]">{description}</p></div>
          <StatusBadge status="neutral">{count}</StatusBadge>
        </div>
        <Link href={href} className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[var(--primary)] px-4 text-sm font-bold text-white hover:bg-[var(--primary-pressed)]">{action}</Link>
      </CardContent>
    </Card>
  );
}

function BuyerRequestList({ data }: { data: BuyerData }) {
  return <div className="mt-6 divide-y divide-[var(--border)]">{data.requests.map((request) => <article key={request.id} className="grid gap-4 py-5 sm:grid-cols-[1fr_auto] sm:items-center"><div><div className="flex flex-wrap gap-2"><b>{request.supplier}</b>{request.warnings > 0 && <StatusBadge status="review">{request.warnings} {request.warnings === 1 ? "warning" : "warnings"}</StatusBadge>}</div><p className="mt-1 text-xs font-semibold text-[var(--muted)]">{request.reference}</p><p className="mt-2 text-sm text-[var(--muted)]">{request.invoice} · {request.amount} · Waiting {request.age}</p></div><QueueButton label="Review request" href={request.href} /></article>)}</div>;
}

function BuyerHistoryList({ data }: { data: BuyerData }) {
  return <div className="mt-6 divide-y divide-[var(--border)]">{data.history.map((item) => <article key={item.id} className="grid gap-4 py-5 sm:grid-cols-[1fr_auto] sm:items-center"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><b>{item.supplier}</b><StatusBadge status={item.status === "confirmed" ? "success" : "error"}>{item.status}</StatusBadge></div><p className="mt-2 text-sm text-[var(--muted)]">{item.invoice} · {item.amount} · {item.decided}</p></div><QueueButton label="View receipt" href={item.href} /></article>)}</div>;
}
