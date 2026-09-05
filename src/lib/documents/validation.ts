import { z } from "zod";
import type { Database } from "@/types/database";

export const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
export const DOCUMENT_ACCEPT = "application/pdf,image/jpeg,image/png";
export const DOCUMENT_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;
export type DocumentKind = Database["public"]["Enums"]["document_kind"];

const extensionByMime: Record<(typeof DOCUMENT_MIME_TYPES)[number], string[]> = {
  "application/pdf": ["pdf"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
};

export const documentPreparationSchema = z.object({
  applicationId: z.uuid(),
  kind: z.enum(["purchase_order", "delivery_evidence", "invoice"]),
  originalFilename: z.string().trim().min(1).max(180),
  mimeType: z.enum(DOCUMENT_MIME_TYPES),
  byteSize: z.number().int().positive().max(DOCUMENT_MAX_BYTES),
}).superRefine((value,context)=>{
  const extension=value.originalFilename.split(".").pop()?.toLowerCase()??"";
  if(!extensionByMime[value.mimeType].includes(extension))context.addIssue({code:"custom",path:["originalFilename"],message:"The filename extension does not match the selected file type."});
});

export function sanitizeDocumentFilename(filename:string){
  const leaf=filename.split(/[\\/]/).pop()??"document";
  const dot=leaf.lastIndexOf(".");
  const rawBase=dot>0?leaf.slice(0,dot):leaf;
  const rawExtension=dot>0?leaf.slice(dot+1).toLowerCase():"";
  const base=rawBase.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^A-Za-z0-9_-]+/g,"-").replace(/-+/g,"-").replace(/^[-_.]+|[-_.]+$/g,"").slice(0,160)||"document";
  const extension=rawExtension.replace(/[^a-z0-9]/g,"").slice(0,8);
  return extension?`${base}.${extension}`:base;
}

export function validateSelectedDocument(file:Pick<File,"name"|"type"|"size">){
  if(!DOCUMENT_MIME_TYPES.includes(file.type as (typeof DOCUMENT_MIME_TYPES)[number]))return "Choose a PDF, JPEG, or PNG file.";
  if(file.size<=0)return "The selected file is empty.";
  if(file.size>DOCUMENT_MAX_BYTES)return "The file is larger than the 10 MB limit.";
  const parsed=documentPreparationSchema.safeParse({applicationId:"11111111-1111-4111-8111-111111111111",kind:"invoice",originalFilename:file.name,mimeType:file.type,byteSize:file.size});
  if(!parsed.success)return parsed.error.issues[0]?.message??"Choose a valid document.";
  return null;
}

export function hasExpectedFileSignature(bytes:Uint8Array,mimeType:string){
  if(mimeType==="application/pdf")return bytes.length>=5&&bytes[0]===0x25&&bytes[1]===0x50&&bytes[2]===0x44&&bytes[3]===0x46&&bytes[4]===0x2d;
  if(mimeType==="image/jpeg")return bytes.length>=3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;
  if(mimeType==="image/png")return bytes.length>=8&&[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a].every((value,index)=>bytes[index]===value);
  return false;
}
