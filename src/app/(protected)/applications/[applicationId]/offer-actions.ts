"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireApplicationAccess,requireRole } from "@/lib/auth/dal";
import { funderDeclineSchema,offerFormSchema } from "@/lib/offers/offer-v1";
import { createClient } from "@/lib/supabase/server";

export type OfferActionState={status:"idle"|"error";message?:string;fieldErrors?:Record<string,string>};
const idle:OfferActionState={status:"idle"};void idle;

export async function startFunderReview(applicationId:string,previous:OfferActionState):Promise<OfferActionState>{
  void previous;const id=z.uuid().safeParse(applicationId);if(!id.success)return{status:"error",message:"The application could not be identified."};await requireRole("funder");
  const supabase=await createClient();const {error}=await supabase.rpc("start_funder_review",{target_application_id:id.data});if(error)return{status:"error",message:"This evidence package is no longer available for review."};
  revalidatePath(`/applications/${id.data}`);revalidatePath("/dashboard");return{status:"idle"};
}

export async function createFundingProposal(previous:OfferActionState,formData:FormData):Promise<OfferActionState>{
  void previous;await requireRole("funder");const parsed=offerFormSchema.safeParse({applicationId:formData.get("applicationId"),advancePercent:formData.get("advancePercent"),feePercent:formData.get("feePercent"),expiryDate:formData.get("expiryDate")});if(!parsed.success)return invalid(parsed.error);
  await requireApplicationAccess(parsed.data.applicationId);const supabase=await createClient();const {data,error}=await supabase.rpc("create_funder_decision_v1",{target_application_id:parsed.data.applicationId,target_advance_bps:parsed.data.advanceBps,target_fee_bps:parsed.data.feeBps,target_expiry_date:parsed.data.expiryDate});
  const offerId=readOfferId(data);if(error||!offerId)return{status:"error",message:"The funding proposal was not saved. Reload the evidence and try again."};revalidatePath("/dashboard");redirect(`/offers/${offerId}`);
}

export async function declineApplication(previous:OfferActionState,formData:FormData):Promise<OfferActionState>{
  void previous;await requireRole("funder");const parsed=funderDeclineSchema.safeParse({applicationId:formData.get("applicationId"),reason:formData.get("reason")});if(!parsed.success)return invalid(parsed.error);
  await requireApplicationAccess(parsed.data.applicationId);const supabase=await createClient();const {data,error}=await supabase.rpc("create_funder_decision_v1",{target_application_id:parsed.data.applicationId,target_decline_reason:parsed.data.reason});const offerId=readOfferId(data);if(error||!offerId)return{status:"error",message:"The decline was not saved. Reload and try again."};revalidatePath("/dashboard");redirect(`/offers/${offerId}`);
}

function invalid(error:z.ZodError){const fieldErrors:Record<string,string>={};for(const issue of error.issues)fieldErrors[issue.path.join(".")]??=issue.message;return{status:"error" as const,message:"Review the highlighted decision details.",fieldErrors};}
function readOfferId(value:unknown){if(!value||typeof value!=="object"||Array.isArray(value))return null;const id=(value as Record<string,unknown>).offerId;return typeof id==="string"&&z.uuid().safeParse(id).success?id:null;}
