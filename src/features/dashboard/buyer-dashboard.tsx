import { EmptyState } from "@/components/empty-state";
import { PageHeading } from "@/components/page-heading";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardData } from "@/lib/dashboard/repository";
import { Metrics, QueueButton } from "./shared";

export function BuyerDashboard({ data }: { data: Extract<DashboardData, { role: "buyer" }> }) {
  const count = data.requests.length;
  return (
    <div className="page-enter mx-auto max-w-6xl">
      <PageHeading eyebrow="Buyer overview" title={count ? `${count} ${count === 1 ? "request is" : "requests are"} waiting.` : "Your confirmation queue is clear."} description="Confirm what your organization already knows so genuine suppliers can move forward faster." />
      <Metrics items={data.metrics} />
      <Card id="confirmations" className="mt-8 scroll-mt-24">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-bold">Pending confirmations</h2><p className="mt-1 text-sm text-[var(--muted)]">Oldest requests are shown first.</p></div><StatusBadge status={count ? "review" : "success"}>{count} pending</StatusBadge></div>
          {count ? <div className="mt-6 divide-y divide-[var(--border)]">{data.requests.map((request) => <article key={request.id} className="grid gap-4 py-5 sm:grid-cols-[1fr_auto] sm:items-center"><div><div className="flex flex-wrap gap-2"><b>{request.supplier}</b>{request.warnings > 0 && <StatusBadge status="review">{request.warnings} {request.warnings === 1 ? "warning" : "warnings"}</StatusBadge>}</div><p className="mt-1 text-xs font-semibold text-[var(--muted)]">{request.reference}</p><p className="mt-2 text-sm text-[var(--muted)]">{request.invoice} · {request.amount} · Waiting {request.age}</p></div><QueueButton label="Review request" href={request.href} /></article>)}</div> : <EmptyState title="No confirmations waiting" description="New requests addressed to your organization will appear here." />}
        </CardContent>
      </Card>
      <Card id="history" className="mt-6 scroll-mt-24">
        <CardContent className="pt-6">
          <h2 className="text-xl font-bold">Decision history</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Completed confirmations and disputes are read-only.</p>
          {data.history.length ? <div className="mt-6 divide-y divide-[var(--border)]">{data.history.map((item) => <article key={item.id} className="grid gap-4 py-5 sm:grid-cols-[1fr_auto] sm:items-center"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><b>{item.supplier}</b><StatusBadge status={item.status === "confirmed" ? "success" : "error"}>{item.status}</StatusBadge></div><p className="mt-2 text-sm text-[var(--muted)]">{item.invoice} · {item.amount} · {item.decided}</p></div><QueueButton label="View receipt" href={item.href} /></article>)}</div> : <EmptyState title="No completed decisions" description="Your signed confirmations and submitted disputes will appear here." />}
        </CardContent>
      </Card>
    </div>
  );
}
