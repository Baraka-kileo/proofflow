"use client";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export function DialogContent({ className, children, title, description }: { className?: string; children: React.ReactNode; title: string; description?: string }) { return <DialogPrimitive.Portal><DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/35 data-[state=open]:animate-[fade-in_.2s_ease-out] motion-reduce:animate-none" /><DialogPrimitive.Content className={cn("fixed left-1/2 top-1/2 z-50 w-[min(92vw,560px)] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 outline-none data-[state=open]:animate-[dialog-in_.2s_ease-out] motion-reduce:animate-none", className)}><DialogPrimitive.Title className="pr-10 text-xl font-bold tracking-tight">{title}</DialogPrimitive.Title>{description && <DialogPrimitive.Description className="mt-2 text-sm text-[var(--muted)]">{description}</DialogPrimitive.Description>}<DialogPrimitive.Close aria-label="Close dialog" className="absolute right-4 top-4 grid size-11 place-items-center rounded-xl hover:bg-[var(--soft)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--focus)]"><X aria-hidden="true" className="size-5" /></DialogPrimitive.Close><div className="mt-6">{children}</div></DialogPrimitive.Content></DialogPrimitive.Portal>; }
