import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireApplicationAccess } from "@/lib/auth/dal";

export const metadata:Metadata={title:"Application"};

export default async function ApplicationPage({params}:{params:Promise<{applicationId:string}>}){const {application}=await requireApplicationAccess((await params).applicationId);return <div className="page-enter mx-auto max-w-4xl"><PageHeading eyebrow="Application created" title={application.invoice_number??"Private draft"} description="Your private draft is saved. The guided evidence steps arrive in the next completed build unit."/><Card className="mt-10"><CardContent className="pt-6"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 size-5 text-[var(--success)]" aria-hidden="true"/><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">Draft saved securely</h2><StatusBadge status="neutral">Draft</StatusBadge></div><p className="mt-2 text-sm text-[var(--muted)]">Purchase order: {application.purchase_order_reference}</p></div></div><Link href="/dashboard" className="mt-6 inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] px-4 text-sm font-semibold hover:bg-[var(--soft)]">Return to overview</Link></CardContent></Card></div>}
