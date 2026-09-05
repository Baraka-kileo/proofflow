import { FileQuestion } from "lucide-react";
import Link from "next/link";

export default function ProtectedNotFound() {
  return (
    <section className="grid min-h-[60vh] place-items-center py-8" aria-labelledby="protected-not-found-title">
      <div className="max-w-lg text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--soft)] text-[var(--primary)]">
          <FileQuestion aria-hidden="true" />
        </span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[.12em] text-[var(--primary)]">Page unavailable</p>
        <h1 id="protected-not-found-title" className="mt-3 text-4xl font-semibold tracking-[-.05em]">This page is not part of your evidence trail.</h1>
        <p className="mt-4 leading-7 text-[var(--muted)]">The link may be outdated or your current role may not have access to this record.</p>
        <Link href="/dashboard" className="mt-7 inline-flex min-h-11 items-center rounded-xl bg-[var(--primary)] px-4 text-sm font-bold text-white">Return to overview</Link>
      </div>
    </section>
  );
}
