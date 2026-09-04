import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn("h-12 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 text-sm text-[var(--ink)] outline-none transition duration-150 placeholder:text-[var(--muted)] focus:border-[var(--focus)] focus:ring-3 focus:ring-[color-mix(in_srgb,var(--focus)_18%,transparent)] disabled:cursor-not-allowed disabled:bg-[var(--soft)] disabled:opacity-70 aria-invalid:border-[var(--error)]", className)} {...props} />;
});
