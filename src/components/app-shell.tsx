import { LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { ConnectionStatus } from "@/components/connection-status";
import { Logo } from "@/components/logo";
import { Navigation, OrganizationBadge } from "@/components/navigation";
import { signOut } from "@/lib/auth/actions";
import type { SessionUser } from "@/types/domain";

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  return (
    <div className="app-layout">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <ConnectionStatus />

      <aside className="app-rail">
        <Logo className="px-1" />

        <div className="mt-7 flex-1">
          <p className="mb-2 px-3.5 text-[10px] font-bold uppercase tracking-[.14em] text-[var(--muted)]">
            Workspace
          </p>
          <Navigation role={user.role} />
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3.5 text-xs text-[var(--muted)] shadow-[0_1px_0_rgba(23,32,29,.03)]">
          <div className="mb-3 flex items-center gap-2 font-semibold text-[var(--ink)]">
            <span
              className="size-2 rounded-full bg-[var(--review)]"
              aria-hidden="true"
            />
            Secure workspace
          </div>
          <OrganizationBadge
            organization={user.organization}
            role={user.role}
          />
          <p className="mt-2 leading-5">
            Private evidence and actions are restricted by organization and role.
          </p>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <Link
            href="/account"
            className="group min-w-0 rounded-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--focus)]"
            aria-label="Open your account"
          >
            <span className="text-xs font-semibold uppercase tracking-[.12em] text-[var(--primary)]">
              {user.organization}
            </span>
            <p className="mt-1 flex items-center gap-2 text-sm text-[var(--muted)] group-hover:text-[var(--ink)]">
              <UserRound aria-hidden="true" className="size-4" />
              {user.name} · <RoleLabel role={user.role} />
            </p>
          </Link>
          <div className="flex items-center gap-2">
            <form action={signOut}>
              <button
                aria-label="Sign out"
                title="Sign out"
                className="grid size-11 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--error)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--focus)]"
              >
                <LogOut aria-hidden="true" className="size-5" />
              </button>
            </form>
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className="app-content">
          {children}
        </main>
      </div>

      <div className="mobile-bar">
        <Navigation role={user.role} mobile />
      </div>
    </div>
  );
}

function RoleLabel({ role }: { role: SessionUser["role"] }) {
  const presentation = {
    sme: {
      label: "SME",
      className: "bg-[var(--success-soft)] text-[var(--success)]",
    },
    buyer: {
      label: "Large customer",
      className: "bg-[var(--review-soft)] text-[var(--review)]",
    },
    funder: {
      label: "Funder / Bank",
      className: "bg-[#edf1ff] text-[#2949a8]",
    },
  }[role];
  return (
    <span
      className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[.06em] ${presentation.className}`}
    >
      {presentation.label}
    </span>
  );
}
