"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { applicationDraftSchema, moneyToMinorUnits, type ApplicationDraftState } from "@/lib/validation/application-draft";

export async function createApplicationDraft(_state:ApplicationDraftState,formData:FormData):Promise<ApplicationDraftState>{
  const session=await requireRole("sme");
  const parsed=applicationDraftSchema.safeParse({buyerOrganizationId:formData.get("buyerOrganizationId"),purchaseOrderReference:formData.get("purchaseOrderReference"),invoiceNumber:formData.get("invoiceNumber"),invoiceAmount:formData.get("invoiceAmount"),currency:formData.get("currency"),expectedDueDate:formData.get("expectedDueDate"),aiConsent:formData.get("aiConsent")});
  if(!parsed.success){const errors=parsed.error.issues.map(issue=>({id:String(issue.path[0]),message:issue.message}));return{errors:[...new Map(errors.map(item=>[item.id,item])).values()]};}
  const supabase=await createClient();
  const {data:buyer,error:buyerError}=await supabase.from("organizations").select("id").eq("id",parsed.data.buyerOrganizationId).eq("kind","buyer").maybeSingle();
  if(buyerError||!buyer)return{errors:[{id:"buyerOrganizationId",message:"Choose an available buyer organization."}]};
  const amountMinor=moneyToMinorUnits(parsed.data.invoiceAmount);
  const applicationId=randomUUID();
  const {error}=await supabase.from("applications").insert({id:applicationId,owner_organization_id:session.organizationId,buyer_organization_id:buyer.id,created_by:session.id,title:`Invoice ${parsed.data.invoiceNumber} evidence`,purchase_order_reference:parsed.data.purchaseOrderReference,invoice_number:parsed.data.invoiceNumber,invoice_total_minor:amountMinor,requested_amount_minor:Math.floor(amountMinor*0.8),currency:parsed.data.currency,invoice_due_on:parsed.data.expectedDueDate,ai_processing_consented_at:new Date().toISOString(),status:"draft"});
  if(error){if(error.code==="23505")return{errors:[{id:"invoiceNumber",message:"This invoice number already exists for the selected buyer."}]};return{errors:[],message:"The draft could not be created. Please try again."};}
  redirect(`/applications/${applicationId}`);
}
