import { Bell } from "lucide-react";
import { ConnectionStatus } from "@/components/connection-status";
import { Logo } from "@/components/logo";
import { Navigation, OrganizationBadge } from "@/components/navigation";
import { signOut } from "@/lib/auth/actions";
import type { SessionUser } from "@/types/domain";

export function AppShell({ user, children }: { user:SessionUser; children:React.ReactNode }) {
  return <div className="app-layout"><a href="#main-content" className="skip-link">Skip to main content</a><ConnectionStatus /><aside className="app-rail"><Logo /><div className="mt-8"><OrganizationBadge organization={user.organization} role={user.role} /></div><div className="mt-8 flex-1"><Navigation role={user.role} /></div><div className="rounded-xl bg-[var(--soft)] p-4 text-xs leading-5 text-[var(--muted)]"><b className="mb-1 block text-[var(--ink)]">Hosted demo workspace</b><p>Synthetic data only. Finance and money movement are simulated.</p><form action={signOut}><button className="mt-3 font-semibold text-[var(--primary)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--focus)]">Sign out</button></form></div></aside><div className="app-main"><header className="app-topbar"><div><span className="text-xs font-semibold uppercase tracking-[.12em] text-[var(--primary)]">{user.organization}</span><p className="mt-1 text-sm text-[var(--muted)]">{user.name} · <span className="capitalize">{user.role}</span></p></div><button className="grid size-11 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]" aria-label="Notifications" disabled title="Notifications arrive after live data is connected"><Bell aria-hidden="true" className="size-5" /></button></header><main id="main-content" tabIndex={-1} className="app-content">{children}</main></div><div className="mobile-bar"><Navigation role={user.role} mobile /></div></div>;
}
