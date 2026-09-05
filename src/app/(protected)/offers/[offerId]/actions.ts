"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/dal";
import { offerResponseSchema } from "@/lib/offers/offer-v1";
import { createClient } from "@/lib/supabase/server";

export type OfferResponseState={status:"idle"|"error";message?:string};

export async function respondToSimulatedOffer(previous:OfferResponseState,formData:FormData):Promise<OfferResponseState>{
  void previous;await requireRole("sme");const parsed=offerResponseSchema.safeParse({offerId:formData.get("offerId"),decision:formData.get("decision"),reason:formData.get("reason")});if(!parsed.success)return{status:"error",message:parsed.error.issues[0]?.message??"Review your response."};
  const supabase=await createClient();const {error}=await supabase.rpc("respond_to_simulated_offer_v1",{target_offer_id:parsed.data.offerId,target_decision:parsed.data.decision,target_reason:parsed.data.reason||undefined});if(error)return{status:"error",message:error.message.includes("expired")?"This simulated offer has expired and cannot be accepted.":"The response was not saved. Reload and try again."};
  revalidatePath(`/offers/${parsed.data.offerId}`);revalidatePath("/dashboard");redirect(`/offers/${parsed.data.offerId}?responded=1`);
}

export async function completeSimulatedFunding(offerId:string,previous:OfferResponseState):Promise<OfferResponseState>{
  void previous;const id=z.uuid().safeParse(offerId);if(!id.success)return{status:"error",message:"The simulated offer could not be identified."};await requireRole("sme");const supabase=await createClient();const {error}=await supabase.rpc("complete_simulated_funding",{target_offer_id:id.data});if(error)return{status:"error",message:"The simulation could not be completed."};revalidatePath(`/offers/${id.data}`);revalidatePath("/dashboard");return{status:"idle"};
}
