import { Inbox } from "lucide-react";
import Link from "next/link";

export function EmptyState({ title, description, action }: { title:string; description:string; action?:{label:string;href:string} }) {
  return <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] px-6 py-12 text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[var(--soft)] text-[var(--primary)]"><Inbox aria-hidden="true" className="size-5" /></span><h2 className="mt-5 text-lg font-bold">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">{description}</p>{action&&<Link className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[var(--primary)] px-4 text-sm font-bold text-white hover:bg-[var(--primary-pressed)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--focus)]" href={action.href}>{action.label}</Link>}</div>;
}
