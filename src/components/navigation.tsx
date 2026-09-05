"use client";

import { Building2, CircleHelp, FileCheck2, FileText, Fingerprint, HandCoins, History, Home, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/domain";

interface NavItem { label: string; href?: string; icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }> }
const navByRole: Record<Role, NavItem[]> = {
  sme: [
    { label:"Overview", href:"/dashboard", icon:Home }, { label:"Applications", href:"/applications/new", icon:FileText }, { label:"Trust Passport", icon:Fingerprint }, { label:"Help", icon:CircleHelp }, { label:"Account", icon:UserRound },
  ],
  buyer: [
    { label:"Overview", href:"/dashboard", icon:Home }, { label:"Confirmations", href:"/dashboard#confirmations", icon:FileCheck2 }, { label:"History", icon:History }, { label:"Help", icon:CircleHelp }, { label:"Account", icon:UserRound },
  ],
  funder: [
    { label:"Overview", href:"/dashboard", icon:Home }, { label:"Applications", icon:FileText }, { label:"Offers", icon:HandCoins }, { label:"Help", icon:CircleHelp }, { label:"Account", icon:UserRound },
  ],
};

function NavEntry({ item, mobile=false }: { item:NavItem; mobile?:boolean }) {
  const pathname=usePathname(); const active=Boolean(item.href && (pathname===item.href || pathname.startsWith(`${item.href}/`))); const Icon=item.icon;
  const styles=cn("group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--focus)] motion-reduce:transition-none",active?"bg-[var(--primary)] text-white":"text-[var(--muted)] hover:bg-[var(--soft)] hover:text-[var(--ink)]",mobile&&"min-w-[70px] flex-col justify-center gap-1 px-2 text-[10px]");
  if(!item.href) return <span className={cn(styles,"cursor-not-allowed opacity-45")} aria-disabled="true" title="Available in the next completed build unit"><Icon aria-hidden={true} className="size-5" />{item.label}</span>;
  return <Link href={item.href} className={styles} aria-current={active?"page":undefined}><Icon aria-hidden={true} className="size-5" />{item.label}</Link>;
}

export function Navigation({ role, mobile=false }: { role:Role; mobile?:boolean }) {
  const items=navByRole[role]; const shown=mobile?items.slice(0,4):items;
  return <nav aria-label={mobile?"Mobile navigation":"Workspace navigation"} className={cn("flex flex-col gap-1",mobile&&"flex-row justify-around gap-0")}>{shown.map(item=><NavEntry key={item.label} item={item} mobile={mobile} />)}</nav>;
}

export function OrganizationBadge({ organization, role }: { organization:string; role:Role }) {
  return <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--soft)] text-[var(--primary)]"><Building2 aria-hidden="true" className="size-4" /></span><span className="min-w-0"><b className="block truncate text-xs">{organization}</b><span className="block capitalize text-[11px] text-[var(--muted)]">{role} workspace</span></span></div>;
}
