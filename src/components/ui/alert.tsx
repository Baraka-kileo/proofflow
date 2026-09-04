import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const tones = { info: [Info, "border-[var(--border)] bg-[var(--soft)]"], success: [CheckCircle2, "border-[#bfddd2] bg-[var(--success-soft)]"], error: [AlertCircle, "border-[#efc6c2] bg-[var(--error-soft)]"] } as const;
export function Alert({ tone="info", title, children, className, ...props }: HTMLAttributes<HTMLDivElement> & { tone?: keyof typeof tones; title: string }) { const [Icon, style]=tones[tone]; return <div role={tone === "error" ? "alert" : "status"} className={cn("flex gap-3 rounded-xl border p-4 text-sm", style, className)} {...props}><Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" /><div><p className="font-bold">{title}</p><div className="mt-1 text-[var(--muted)]">{children}</div></div></div>; }
