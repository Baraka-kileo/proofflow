import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ compact=false, className }: { compact?: boolean; className?: string }) {
  return <Link href="/" className={cn("inline-flex min-h-11 items-center gap-2.5 rounded-lg font-bold tracking-[-.03em] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--focus)]",className)} aria-label="ProofFlow home"><span className="brand-mark" aria-hidden="true"><span /></span>{!compact && <span>ProofFlow</span>}</Link>;
}
