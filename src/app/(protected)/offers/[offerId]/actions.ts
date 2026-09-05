"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/dal";
import { offerResponseSchema } from "@/lib/offers/offer-v1";
import { createClient } from "@/lib/supabase/server";

export type OfferResponseState={status:"idle"|"error";message?:string};

export async function respondToFundingProposal(previous:OfferResponseState,formData:FormData):Promise<OfferResponseState>{
  void previous;await requireRole("sme");const parsed=offerResponseSchema.safeParse({offerId:formData.get("offerId"),decision:formData.get("decision"),reason:formData.get("reason")});if(!parsed.success)return{status:"error",message:parsed.error.issues[0]?.message??"Review your response."};
  const supabase=await createClient();const {error}=await supabase.rpc("respond_to_funding_proposal_v1",{target_offer_id:parsed.data.offerId,target_decision:parsed.data.decision,target_reason:parsed.data.reason||undefined});if(error)return{status:"error",message:error.message.includes("expired")?"This funding proposal has expired and cannot be accepted.":"The response was not saved. Reload and try again."};
  revalidatePath(`/offers/${parsed.data.offerId}`);revalidatePath("/dashboard");redirect(`/offers/${parsed.data.offerId}?responded=1`);
}
