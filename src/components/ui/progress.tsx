import { cn } from "@/lib/utils";

export function Progress({ value, label, className }: { value: number; label: string; className?: string }) {
  const safe = Math.min(100, Math.max(0, value));
  return <div className={cn("space-y-2", className)}><div className="flex justify-between text-xs"><span>{label}</span><span className="font-bold tabular-nums">{safe}%</span></div><div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={safe} className="h-2 overflow-hidden rounded-full bg-[var(--soft)]"><span className="block h-full rounded-full bg-[var(--primary)] transition-[width] duration-200 motion-reduce:transition-none" style={{ width: `${safe}%` }} /></div></div>;
}
