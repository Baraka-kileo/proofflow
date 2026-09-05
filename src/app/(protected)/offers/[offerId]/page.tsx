import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeading } from "@/components/page-heading";
import { OfferReceipt } from "@/features/offers/offer-receipt";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export const metadata:Metadata={title:"Funding proposal"};
export default async function OfferPage({params}:{params:Promise<{offerId:string}>}){const id=z.uuid().safeParse((await params).offerId);if(!id.success)notFound();const session=await requireRole(["sme","funder"]);const supabase=await createClient();const {data:offer,error}=await supabase.from("offers").select("*,application:applications!offers_application_id_fkey(status,invoice_number,owner:organizations!applications_owner_organization_id_fkey(name),buyer:organizations!applications_buyer_organization_id_fkey(name))").eq("id",id.data).maybeSingle();if(error||!offer||offer.invoice_amount_minor===null||!offer.payment_due_on)notFound();return <div className="page-enter mx-auto max-w-6xl"><PageHeading eyebrow="Independent funder decision" title={offer.decision_kind==="decline"?"Funder decision":"Funding proposal"} description="A transparent record of the funding partner's terms and the SME's response."/><div className="mt-8"><OfferReceipt offerId={offer.id} role={session.role as "sme"|"funder"} status={offer.status} decisionKind={offer.decision_kind} supplier={offer.application.owner.name} buyer={offer.application.buyer.name} invoice={offer.application.invoice_number??"Invoice"} currency={offer.currency} invoiceMinor={offer.invoice_amount_minor} advanceMinor={offer.advance_amount_minor} feeMinor={offer.fee_amount_minor} netMinor={offer.net_advance_minor} advanceBps={offer.advance_bps} feeBps={offer.fee_bps} dueDate={offer.payment_due_on} expiresAt={offer.expires_at} responseReason={offer.response_reason} applicationStatus={offer.application.status}/></div></div>}
