import { Check, Circle, FileCheck2, FileText, LockKeyhole, ScanSearch, Send, UploadCloud } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ApplicationStep } from "@/lib/applications/progress";

const icons: Record<ApplicationStep["id"], ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  details: FileText,
  documents: UploadCloud,
  review: FileCheck2,
  verification: ScanSearch,
  buyer: Send,
};

function StepItem({ step, index }: { step: ApplicationStep; index: number }) {
  const Icon = icons[step.id];
  return <li className="relative grid grid-cols-[36px_1fr] gap-3 pb-6 last:pb-0" aria-current={step.state === "current" ? "step" : undefined}>
    {index < 4 && <span aria-hidden="true" className={cn("absolute left-[17px] top-9 h-[calc(100%-20px)] w-px", step.state === "complete" ? "bg-[var(--primary)]" : "bg-[var(--border)]")} />}
    <span className={cn("relative z-10 grid size-9 place-items-center rounded-full border", step.state === "complete" && "border-[var(--primary)] bg-[var(--primary)] text-white", step.state === "current" && "border-[var(--primary)] bg-[var(--success-soft)] text-[var(--primary)]", step.state === "locked" && "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]")}>
      {step.state === "complete" ? <Check className="size-4" aria-hidden="true" /> : step.state === "locked" ? <LockKeyhole className="size-3.5" aria-hidden="true" /> : <Icon className="size-4" aria-hidden={true} />}
    </span>
    <div className="pt-0.5">
      <div className="flex items-center justify-between gap-2"><b className={cn("text-sm", step.state === "locked" && "text-[var(--muted)]")}>{step.label}</b><span className="text-[10px] font-bold uppercase tracking-[.1em] text-[var(--muted)]">{step.state}</span></div>
      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{step.description}</p>
      {step.state === "locked" && <p className="mt-1 text-[11px] leading-4 text-[var(--muted)]">{step.lockedReason}</p>}
    </div>
  </li>;
}

export function ApplicationTaskLayout({ steps, currentIndex, completedCount, children }: { steps: ApplicationStep[]; currentIndex: number; completedCount: number; children: ReactNode }) {
  const current = steps[currentIndex];
  const nextLocked = steps.slice(currentIndex + 1).find((step) => step.state === "locked");
  return <div className="mx-auto grid max-w-[1080px] items-start gap-8 lg:grid-cols-[280px_minmax(0,720px)] lg:gap-10">
    <aside className="sticky top-28 hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 lg:block" aria-label="Application progress">
      <div className="mb-6 flex items-center justify-between"><div><span className="text-[11px] font-bold uppercase tracking-[.12em] text-[var(--primary)]">Application journey</span><p className="mt-1 text-xs text-[var(--muted)]">{completedCount} of 5 complete</p></div><Circle className="size-4 text-[var(--primary)]" aria-hidden="true" /></div>
      <ol>{steps.map((step, index) => <StepItem key={step.id} step={step} index={index} />)}</ol>
    </aside>
    <div className="min-w-0">
      <section className="mb-7 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 lg:hidden" aria-label="Application progress">
        <div className="flex items-start justify-between gap-4"><div><span className="text-[11px] font-bold uppercase tracking-[.12em] text-[var(--primary)]">Step {currentIndex + 1} of 5</span><h2 className="mt-1 text-lg font-bold">{current.label}</h2><p className="mt-1 text-xs text-[var(--muted)]">{completedCount} complete · {current.description}</p></div><span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--success-soft)] text-[var(--primary)]">{(() => { const Icon = icons[current.id]; return <Icon className="size-5" aria-hidden={true} />; })()}</span></div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--soft)]" role="progressbar" aria-label="Application completion" aria-valuemin={0} aria-valuemax={5} aria-valuenow={completedCount}><span className="block h-full rounded-full bg-[var(--primary)] transition-[width] motion-reduce:transition-none" style={{ width: `${completedCount * 20}%` }} /></div>
        {nextLocked && <p className="mt-3 flex gap-2 text-[11px] leading-4 text-[var(--muted)]"><LockKeyhole className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" /><span><b>Next: {nextLocked.label}.</b> {nextLocked.lockedReason}</span></p>}
      </section>
      {children}
    </div>
  </div>;
}
