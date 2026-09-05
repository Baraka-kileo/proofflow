"use client";

import {
  Building2,
  CircleHelp,
  FileCheck2,
  FileText,
  Fingerprint,
  HandCoins,
  History,
  Home,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/domain";

interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}

const navByRole: Record<Role, NavItem[]> = {
  sme: [
    { label: "Overview", href: "/dashboard", icon: Home },
    { label: "Applications", href: "/applications", icon: FileText },
    { label: "Trust Passport", href: "/trust-passport", icon: Fingerprint },
    { label: "Help", href: "/help", icon: CircleHelp },
    { label: "Account", href: "/account", icon: UserRound },
  ],
  buyer: [
    { label: "Overview", href: "/dashboard", icon: Home },
    { label: "Confirmations", href: "/confirmations", icon: FileCheck2 },
    { label: "History", href: "/confirmations/history", icon: History },
    { label: "Help", href: "/help", icon: CircleHelp },
    { label: "Account", href: "/account", icon: UserRound },
  ],
  funder: [
    { label: "Overview", href: "/dashboard", icon: Home },
    { label: "Applications", href: "/applications", icon: FileText },
    { label: "Offers", href: "/offers", icon: HandCoins },
    { label: "Help", href: "/help", icon: CircleHelp },
    { label: "Account", href: "/account", icon: UserRound },
  ],
};

function NavEntry({
  item,
  mobile = false,
  active = false,
}: {
  item: NavItem;
  mobile?: boolean;
  active?: boolean;
}) {
  const Icon = item.icon;
  const styles = cn(
    "group flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--focus)] motion-reduce:transition-none",
    active
      ? "bg-[var(--primary)] text-white shadow-sm"
      : "text-[var(--muted)] hover:bg-[var(--soft)] hover:text-[var(--ink)]",
    mobile
      ? "min-w-[70px] flex-1 flex-col justify-center gap-1 px-2 text-[10px]"
      : "w-full justify-start",
  );

  return (
    <Link
      href={item.href}
      className={styles}
      aria-current={active ? "page" : undefined}
    >
      <Icon aria-hidden={true} className="size-5 shrink-0" />
      {item.label}
    </Link>
  );
}

export function Navigation({
  role,
  mobile = false,
}: {
  role: Role;
  mobile?: boolean;
}) {
  const pathname = usePathname();
  const items = navByRole[role];
  const shown = mobile ? items.slice(0, 4) : items;
  const activeHref = [...items]
    .filter(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    )
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav
      aria-label={mobile ? "Mobile navigation" : "Workspace navigation"}
      className={cn(
        "flex w-full flex-col items-stretch gap-1",
        mobile && "flex-row items-center justify-around gap-0",
      )}
    >
      {shown.map((item) => (
        <NavEntry
          key={item.label}
          item={item}
          mobile={mobile}
          active={item.href === activeHref}
        />
      ))}
    </nav>
  );
}

export function OrganizationBadge({
  organization,
  role,
}: {
  organization: string;
  role: Role;
}) {
  const presentation = {
    sme: {
      label: "SME workspace",
      chip: "bg-[var(--success-soft)] text-[var(--success)]",
    },
    buyer: {
      label: "Large customer workspace",
      chip: "bg-[var(--review-soft)] text-[var(--review)]",
    },
    funder: {
      label: "Funder / bank workspace",
      chip: "bg-[#edf1ff] text-[#2949a8]",
    },
  }[role];
  return (
    <div
      className="flex items-start gap-3"
      aria-label={`${organization}, ${presentation.label}`}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--soft)] text-[var(--primary)]">
        <Building2 aria-hidden="true" className="size-[18px]" />
      </span>
      <span className="min-w-0 pt-0.5">
        <b className="block text-[13px] leading-[1.25] tracking-[-.01em]">
          {organization}
        </b>
        <span
          className={`mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[.06em] ${presentation.chip}`}
        >
          {presentation.label}
        </span>
      </span>
    </div>
  );
}
