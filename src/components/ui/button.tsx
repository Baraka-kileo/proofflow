import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-[background-color,color,border-color,transform] duration-150 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:translate-y-px motion-reduce:transition-none",
  {
    variants: {
      variant: {
        primary: "bg-[var(--primary)] text-white hover:bg-[var(--primary-pressed)]",
        secondary: "border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--soft)]",
        ghost: "text-[var(--muted)] hover:bg-[var(--soft)] hover:text-[var(--ink)]",
        danger: "bg-[var(--error)] text-white hover:bg-[#8f1c14]",
      },
      size: { default: "h-12", sm: "h-11 px-3", lg: "h-14 px-6 text-base", icon: "size-11 p-0" },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { loading?: boolean }

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, loading = false, disabled, children, ...props }, ref,
) {
  return <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>{loading && <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />}{children}</button>;
});
