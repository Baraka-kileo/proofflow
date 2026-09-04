"use client";
import { Toaster as Sonner } from "sonner";
export function Toaster() { return <Sonner position="top-right" toastOptions={{ classNames: { toast: "!rounded-xl !border-[var(--border)] !bg-[var(--surface)] !text-[var(--ink)]" } }} />; }
