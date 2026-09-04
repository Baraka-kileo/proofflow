import { AlertTriangle, Check, Clock3, X } from "lucide-react";
import { cn } from "@/lib/utils";

const config = {
  success: { icon: Check, className: "bg-[var(--success-soft)] text-[var(--success)]" },
  review: { icon: AlertTriangle, className: "bg-[var(--review-soft)] text-[var(--review)]" },
  error: { icon: X, className: "bg-[var(--error-soft)] text-[var(--error)]" },
  neutral: { icon: Clock3, className: "bg-[var(--soft)] text-[var(--muted)]" },
} as const;

export function StatusBadge({ status, children, className }: { status: keyof typeof config; children: React.ReactNode; className?: string }) {
  const { icon: Icon, className: tone } = config[status];
  return <span className={cn("inline-flex min-h-7 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold", tone, className)}><Icon aria-hidden="true" className="size-3.5" />{children}</span>;
}
