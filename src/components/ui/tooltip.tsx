"use client";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
export const TooltipProvider = TooltipPrimitive.Provider;
export function Tooltip({ trigger, children }: { trigger: React.ReactNode; children: React.ReactNode }) { return <TooltipPrimitive.Root><TooltipPrimitive.Trigger asChild>{trigger}</TooltipPrimitive.Trigger><TooltipPrimitive.Portal><TooltipPrimitive.Content sideOffset={6} className="z-50 rounded-lg bg-[var(--ink)] px-2.5 py-1.5 text-xs text-white">{children}<TooltipPrimitive.Arrow className="fill-[var(--ink)]" /></TooltipPrimitive.Content></TooltipPrimitive.Portal></TooltipPrimitive.Root>; }
