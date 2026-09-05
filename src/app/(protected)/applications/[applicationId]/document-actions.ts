"use server";

import { createHash, randomUUID } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import { revalidatePath } from "next/cache";
import { requireApplicationAccess, requireRole } from "@/lib/auth/dal";
import { documentPreparationSchema, hasExpectedFileSignature, sanitizeDocumentFilename } from "@/lib/documents/validation";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const bucket="application-documents";
const editableStatuses=["draft","documents_uploaded"] as const;
type ActionResult={ok:true}|{ok:false;message:string;code?:string};

async function requireEditableApplication(applicationId:string){
  const session=await requireRole("sme");
  const {application}=await requireApplicationAccess(applicationId);
  if(application.owner_organization_id!==session.organizationId||!editableStatuses.includes(application.status as (typeof editableStatuses)[number]))return null;
  return{session,application};
}

export async function prepareDocumentUpload(input:unknown):Promise<(ActionResult&{documentId?:string;storagePath?:string;safeFilename?:string})>{
  const parsed=documentPreparationSchema.safeParse(input);
  if(!parsed.success)return{ok:false,message:parsed.error.issues[0]?.message??"Choose a valid document."};
  const access=await requireEditableApplication(parsed.data.applicationId);
  if(!access)return{ok:false,message:"This application can no longer accept document changes."};
  const supabase=await createClient();
  const {data:existing,error:existingError}=await supabase.from("documents").select("id,storage_path,upload_completed_at").eq("application_id",access.application.id).eq("kind",parsed.data.kind).maybeSingle();
  if(existingError)return{ok:false,message:"The document slot could not be checked. Please try again."};
  if(existing?.upload_completed_at)return{ok:false,code:"DUPLICATE_SLOT",message:"This document slot already has a completed file. Remove it before choosing another."};
  if(existing){await supabase.storage.from(bucket).remove([existing.storage_path]);const {error:cleanupError}=await supabase.from("documents").delete().eq("id",existing.id);if(cleanupError)return{ok:false,message:"The interrupted upload could not be cleared. Please try again."};}
  const documentId=randomUUID();
  const safeFilename=sanitizeDocumentFilename(parsed.data.originalFilename);
  const storagePath=`${access.session.organizationId}/${access.application.id}/${documentId}/${safeFilename}`;
  const pendingHash=createHash("sha256").update(`pending:${documentId}`).digest("hex");
  const {error}=await supabase.from("documents").insert({id:documentId,application_id:access.application.id,owner_organization_id:access.session.organizationId,uploaded_by:access.session.id,kind:parsed.data.kind,original_filename:parsed.data.originalFilename,storage_path:storagePath,mime_type:parsed.data.mimeType,byte_size:parsed.data.byteSize,sha256:pendingHash});
  if(error){if(error.code==="23505")return{ok:false,code:"DUPLICATE_SLOT",message:"This document slot already contains a file."};return{ok:false,message:"The private upload could not be prepared. Please try again."};}
  return{ok:true,documentId,storagePath,safeFilename};
}

export async function completeDocumentUpload(documentId:string):Promise<ActionResult&{pageCount?:number;uploadCompletedAt?:string}>{
  const parsed=z.uuid().safeParse(documentId);if(!parsed.success)return{ok:false,message:"The uploaded document could not be identified."};
  await requireRole("sme");
  const supabase=await createClient();
  const {data:document,error}=await supabase.from("documents").select("id,application_id,kind,original_filename,storage_path,mime_type,byte_size").eq("id",parsed.data).maybeSingle();
  if(error||!document)return{ok:false,message:"The uploaded document could not be found."};
  const access=await requireEditableApplication(document.application_id);if(!access)return{ok:false,message:"This application can no longer accept document changes."};
  const {data:blob,error:downloadError}=await supabase.storage.from(bucket).download(document.storage_path);
  if(downloadError||!blob)return{ok:false,message:"The upload did not finish. Retry the file transfer."};
  const bytes=new Uint8Array(await blob.arrayBuffer());
  if(bytes.byteLength!==document.byte_size||!hasExpectedFileSignature(bytes,document.mime_type)){await supabase.storage.from(bucket).remove([document.storage_path]);await supabase.from("documents").delete().eq("id",document.id);return{ok:false,code:"INVALID_FILE",message:"The file contents do not match the selected PDF or image type."};}
  let pageCount=1;
  if(document.mime_type==="application/pdf"){try{pageCount=(await PDFDocument.load(bytes,{ignoreEncryption:true})).getPageCount();}catch{await supabase.storage.from(bucket).remove([document.storage_path]);await supabase.from("documents").delete().eq("id",document.id);return{ok:false,code:"INVALID_PDF",message:"This PDF could not be read. Export it again or choose an image."};}}
  const sha256=createHash("sha256").update(bytes).digest("hex");
  const {data:duplicate,error:duplicateLookupError}=await supabase.from("documents").select("id").eq("owner_organization_id",access.session.organizationId).eq("sha256",sha256).not("upload_completed_at","is",null).neq("id",document.id).limit(1).maybeSingle();
  if(duplicateLookupError)return{ok:false,message:"The file could not be checked for duplicates. Please retry."};
  if(duplicate){const {error:recordError}=await supabase.rpc("record_exact_document_duplicate",{target_application_id:document.application_id,attempted_filename:document.original_filename,content_sha256:sha256});if(recordError)return{ok:false,message:"The duplicate check could not be recorded. Please retry."};await supabase.storage.from(bucket).remove([document.storage_path]);await supabase.from("documents").delete().eq("id",document.id);return{ok:false,code:"DUPLICATE_FILE",message:"V009 · Exact duplicate file. These same bytes are already stored in your SME workspace."};}
  const uploadCompletedAt=new Date().toISOString();
  const {error:updateError}=await supabase.from("documents").update({sha256,page_count:pageCount,upload_completed_at:uploadCompletedAt}).eq("id",document.id);
  if(updateError){let duplicateRecorded=false;if(updateError.code==="23505"){const {error:recordError}=await supabase.rpc("record_exact_document_duplicate",{target_application_id:document.application_id,attempted_filename:document.original_filename,content_sha256:sha256});duplicateRecorded=!recordError;}await supabase.storage.from(bucket).remove([document.storage_path]);await supabase.from("documents").delete().eq("id",document.id);if(duplicateRecorded)return{ok:false,code:"DUPLICATE_FILE",message:"V009 · Exact duplicate file. These same bytes are already stored in your SME workspace."};return{ok:false,message:"The uploaded file could not be finalized. Please retry."};}
  const {count}=await supabase.from("documents").select("id",{count:"exact",head:true}).eq("application_id",document.application_id).not("upload_completed_at","is",null);
  if(count===3)await supabase.from("applications").update({status:"documents_uploaded"}).eq("id",document.application_id).eq("status","draft");
  revalidatePath(`/applications/${document.application_id}`);
  return{ok:true,pageCount,uploadCompletedAt};
}

export async function removeDocumentUpload(documentId:string):Promise<ActionResult>{
  const parsed=z.uuid().safeParse(documentId);if(!parsed.success)return{ok:false,message:"The document could not be identified."};
  await requireRole("sme");
  const supabase=await createClient();
  const {data:document,error}=await supabase.from("documents").select("id,application_id,storage_path").eq("id",parsed.data).maybeSingle();
  if(error||!document)return{ok:false,message:"The document is already unavailable."};
  const access=await requireEditableApplication(document.application_id);if(!access)return{ok:false,message:"This application can no longer accept document changes."};
  const {error:storageError}=await supabase.storage.from(bucket).remove([document.storage_path]);if(storageError)return{ok:false,message:"The private file could not be removed. Please try again."};
  const {error:deleteError}=await supabase.from("documents").delete().eq("id",document.id);if(deleteError)return{ok:false,message:"The document record could not be removed. Please try again."};
  await supabase.from("applications").update({status:"draft"}).eq("id",document.application_id).eq("status","documents_uploaded");
  revalidatePath(`/applications/${document.application_id}`);
  return{ok:true};
}

export async function getDocumentPreviewUrl(documentId:string):Promise<ActionResult&{url?:string}>{
  const parsed=z.uuid().safeParse(documentId);if(!parsed.success)return{ok:false,message:"The document could not be identified."};
  const supabase=await createClient();
  const {data:document,error}=await supabase.from("documents").select("application_id,storage_path,upload_completed_at").eq("id",parsed.data).maybeSingle();
  if(error||!document?.upload_completed_at)return{ok:false,message:"The completed document is unavailable."};
  await requireApplicationAccess(document.application_id);
  const {data,error:signedError}=await supabase.storage.from(bucket).createSignedUrl(document.storage_path,60);
  if(signedError||!data)return{ok:false,message:"A private preview could not be created. Please try again."};
  return{ok:true,url:data.signedUrl};
}
