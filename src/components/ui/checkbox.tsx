"use client";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from "react";
import { cn } from "@/lib/utils";

export const Checkbox = forwardRef<ElementRef<typeof CheckboxPrimitive.Root>, ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>>(function Checkbox({ className, ...props }, ref) {
  return <CheckboxPrimitive.Root ref={ref} className={cn("grid size-5 shrink-0 place-items-center rounded-md border border-[var(--border-strong)] bg-[var(--surface)] outline-none focus-visible:ring-3 focus-visible:ring-[var(--focus)] disabled:opacity-50 data-[state=checked]:border-[var(--primary)] data-[state=checked]:bg-[var(--primary)] data-[state=checked]:text-white", className)} {...props}><CheckboxPrimitive.Indicator><Check className="size-3.5" /></CheckboxPrimitive.Indicator></CheckboxPrimitive.Root>;
});
