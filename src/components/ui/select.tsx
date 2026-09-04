import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, ...props }, ref) {
  return <select ref={ref} className={cn("h-12 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 text-sm outline-none focus:border-[var(--focus)] focus:ring-3 focus:ring-[color-mix(in_srgb,var(--focus)_18%,transparent)] disabled:bg-[var(--soft)]", className)} {...props} />;
});
