import { NextResponse,type NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/dal";
import { generateBuyerConfirmationCertificate } from "@/lib/confirmations/certificate";
import { parseSignature } from "@/lib/confirmations/confirmation-v1";
import { presentLegacyFixtureLabel } from "@/lib/display/legacy-fixtures";
import { createClient } from "@/lib/supabase/server";

export async function GET(request:NextRequest,{params}:{params:Promise<{confirmationId:string}>}){
  const id=z.uuid().safeParse((await params).confirmationId);const session=await getSessionUser();if(!id.success||!session)return new NextResponse("Certificate not found",{status:404});
  const supabase=await createClient();const {data,error}=await supabase.from("confirmations").select("status,approval_id,decided_at,representative_name,representative_job_title,representative_email,signature_strokes,transaction_snapshot").eq("id",id.data).maybeSingle();
  const signature=data?parseSignature(data.signature_strokes):null;const snapshot=data?.transaction_snapshot;
  if(error||!data||data.status!=="confirmed"||!data.approval_id||!data.decided_at||!data.representative_name||!data.representative_job_title||!data.representative_email||!signature||!isSnapshot(snapshot))return new NextResponse("Certificate not found",{status:404});
  const amount=(minor:number)=>new Intl.NumberFormat("en-ZA",{style:"currency",currency:snapshot.currency,maximumFractionDigits:2}).format(minor/100);
  const base=process.env.NEXT_PUBLIC_APP_URL??request.nextUrl.origin;const bytes=await generateBuyerConfirmationCertificate({buyer:presentLegacyFixtureLabel(snapshot.buyer),supplier:presentLegacyFixtureLabel(snapshot.supplier),purchaseOrder:presentLegacyFixtureLabel(snapshot.purchaseOrder),invoice:presentLegacyFixtureLabel(snapshot.invoice),invoiceAmount:amount(snapshot.invoiceAmountMinor),outstandingAmount:amount(snapshot.outstandingAmountMinor),expectedPaymentDate:new Intl.DateTimeFormat("en-ZA",{dateStyle:"long",timeZone:"Africa/Johannesburg"}).format(new Date(`${snapshot.expectedPaymentDate}T12:00:00+02:00`)),name:data.representative_name,role:data.representative_job_title,email:data.representative_email,signed:new Intl.DateTimeFormat("en-ZA",{dateStyle:"medium",timeStyle:"short",timeZone:"Africa/Johannesburg"}).format(new Date(data.decided_at)),approvalId:data.approval_id,signature,verificationUrl:`${base}/confirmations/${id.data}`});
  const download=request.nextUrl.searchParams.get("download")==="1";return new NextResponse(Buffer.from(bytes),{headers:{"Content-Type":"application/pdf","Content-Disposition":`${download?"attachment":"inline"}; filename="ProofFlow-Buyer-Confirmation-${data.approval_id}.pdf"`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
}

type Snapshot={buyer:string;supplier:string;purchaseOrder:string;invoice:string;currency:string;invoiceAmountMinor:number;outstandingAmountMinor:number;expectedPaymentDate:string};
function isSnapshot(value:unknown):value is Snapshot{if(!value||typeof value!=="object"||Array.isArray(value))return false;const v=value as Record<string,unknown>;return ["buyer","supplier","purchaseOrder","invoice","currency","expectedPaymentDate"].every(key=>typeof v[key]==="string")&&typeof v.invoiceAmountMinor==="number"&&typeof v.outstandingAmountMinor==="number";}
