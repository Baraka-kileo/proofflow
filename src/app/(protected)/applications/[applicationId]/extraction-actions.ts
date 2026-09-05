"use server";

import { revalidatePath } from "next/cache";
import { extractPrivateDocument } from "@/lib/ai/extract-private-document";
import { requireApplicationAccess, requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export type ExtractionActionState = { status: "idle" | "error" | "success"; message?: string };

const reviewedFieldsSchema=z.array(z.object({
  id:z.uuid(),
  value:z.union([z.string().max(300),z.boolean()]),
}).strict()).length(21);

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

export async function submitApplicationReview(applicationId:string,previous:ExtractionActionState,formData:FormData):Promise<ExtractionActionState>{
  void previous;
  const parsedApplication=z.uuid().safeParse(applicationId);
  if(!parsedApplication.success)return{status:"error",message:"The application could not be identified."};
  let raw:unknown;
  try{raw=JSON.parse(String(formData.get("reviewedFields")??""));}catch{return{status:"error",message:"The reviewed fields could not be read. Please reload and try again."};}
  const parsedFields=reviewedFieldsSchema.safeParse(raw);
  if(!parsedFields.success)return{status:"error",message:"Review every field and correct the highlighted formats before submitting."};
  const session=await requireRole("sme");
  const {application}=await requireApplicationAccess(parsedApplication.data);
  if(application.owner_organization_id!==session.organizationId||!["fields_extracted","sme_reviewed"].includes(application.status))return{status:"error",message:"This application is not ready for human review."};
  const supabase=await createClient();
  const {error}=await supabase.rpc("submit_application_field_review",{target_application_id:application.id,reviewed_fields:parsedFields.data});
  if(error)return{status:"error",message:"The complete review was not saved. Check every value and try again."};
  revalidatePath(`/applications/${application.id}`);
  return{status:"success",message:"All 21 fields were reviewed and saved."};
}
