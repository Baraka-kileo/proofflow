"use server";

import { revalidatePath } from "next/cache";
import { extractPrivateDocument } from "@/lib/ai/extract-private-document";
import { requireApplicationAccess, requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export type ExtractionActionState = { status: "idle" | "error"; message?: string };

export async function startApplicationExtraction(applicationId:string,previous:ExtractionActionState):Promise<ExtractionActionState>{
  void previous;
  const parsed=z.uuid().safeParse(applicationId);if(!parsed.success)return{status:"error",message:"The application could not be identified."};
  const session=await requireRole("sme");const {application}=await requireApplicationAccess(parsed.data);
  if(application.owner_organization_id!==session.organizationId||application.status!=="documents_uploaded")return{status:"error",message:"This application is not ready for extraction."};
  const supabase=await createClient();const {data:documents,error}=await supabase.from("documents").select("id,kind,upload_completed_at").eq("application_id",application.id);
  if(error||documents?.length!==3||documents.some(document=>!document.upload_completed_at))return{status:"error",message:"Upload all three completed documents before extraction."};
  const order=["purchase_order","delivery_evidence","invoice"];
  for(const document of [...documents].sort((a,b)=>order.indexOf(a.kind)-order.indexOf(b.kind))){const result=await extractPrivateDocument(document.id);if(!result.ok)return{status:"error",message:result.message};}
  revalidatePath(`/applications/${application.id}`);
  return{status:"idle"};
}
