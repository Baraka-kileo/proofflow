import { CheckCircle2, Clock3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { presentAuditAction } from "@/lib/display/audit-events";

export function ApplicationActivity({
  events,
}: {
  events: Array<{ id: string; action: string; createdAt: string }>;
}) {
  return (
    <section aria-labelledby="activity-heading">
      <div className="mb-4">
        <span className="text-xs font-bold uppercase tracking-[.12em] text-[var(--primary)]">
          Audit trail
        </span>
        <h2
          id="activity-heading"
          className="mt-2 text-2xl font-bold tracking-[-.035em]"
        >
          Application activity
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Material steps are timestamped by the server and cannot be rewritten
          by ordinary users.
        </p>
      </div>
      <Card>
        <CardContent className="pt-6">
          {events.length ? (
            <ol className="space-y-0">
              {events.map((event, index) => (
                <li
                  key={event.id}
                  className="relative grid grid-cols-[36px_1fr] gap-3 pb-6 last:pb-0"
                >
                  {index < events.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="absolute left-[17px] top-9 h-[calc(100%-20px)] w-px bg-[var(--border)]"
                    />
                  )}
                  <span className="relative z-10 grid size-9 place-items-center rounded-full bg-[var(--success-soft)] text-[var(--primary)]">
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                  </span>
                  <div className="pt-1">
                    <h3 className="text-sm font-bold">
                      {presentAuditAction(event.action)}
                    </h3>
                    <p className="mt-1 flex items-center gap-1 text-xs text-[var(--muted)]">
                      <Clock3 className="size-3.5" aria-hidden="true" />
                      {new Intl.DateTimeFormat("en-ZA", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(event.createdAt))}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-[var(--muted)]">
              No material activity has been recorded yet.
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
