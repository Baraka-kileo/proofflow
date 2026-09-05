import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { StatusBadge } from "@/components/status-badge";
import { ApplicationTaskLayout } from "@/features/applications/application-task-layout";
import { ApplicationDetailsReceipt } from "@/features/applications/application-details-receipt";
import { DocumentUploadPanel } from "@/features/applications/document-upload-panel";
import { ExtractionReviewWorkspace, type ReviewDocument } from "@/features/applications/extraction-review-workspace";
import { ReviewReadyPanel } from "@/features/applications/review-ready-panel";
import { requireApplicationAccess } from "@/lib/auth/dal";
import { deriveApplicationProgress } from "@/lib/applications/progress";
import { getExtractionModeEnvironment } from "@/lib/env/server";
import { createClient } from "@/lib/supabase/server";

export const metadata:Metadata={title:"Application"};

export default async function ApplicationPage({params}:{params:Promise<{applicationId:string}>}){
  const {application}=await requireApplicationAccess((await params).applicationId);
  const supabase=await createClient();
  const [{data:documents,error:documentsError},{data:buyer,error:buyerError}]=await Promise.all([
    supabase.from("documents").select("id,kind,original_filename,storage_path,byte_size,page_count,upload_completed_at,extraction_status,extraction_provider,document_fields(id,field_name,source_value,normalized_value,confidence_bps,source_label)").eq("application_id",application.id),
    supabase.from("organizations").select("name").eq("id",application.buyer_organization_id).maybeSingle(),
  ]);
  if(documentsError||buyerError)throw new Error("Unable to load the private application workflow.");
  const completedKinds=(documents??[]).filter(document=>document.upload_completed_at).map(document=>document.kind);
  const progress=deriveApplicationProgress(application,completedKinds);
  const amount=application.invoice_total_minor===null?"Amount pending":new Intl.NumberFormat("en-ZA",{style:"currency",currency:application.currency}).format(application.invoice_total_minor/100);
  const storedDocuments=(documents??[]).map(document=>({id:document.id,kind:document.kind,originalFilename:document.original_filename,storagePath:document.storage_path,byteSize:document.byte_size,pageCount:document.page_count,uploadCompletedAt:document.upload_completed_at}));
  const documentOrder=["purchase_order","delivery_evidence","invoice"];
  const extractedDocuments=(documents??[]).filter(document=>document.extraction_status==="extracted"&&document.document_fields.length>0).sort((a,b)=>documentOrder.indexOf(a.kind)-documentOrder.indexOf(b.kind));
  const reviewDocuments:ReviewDocument[]=await Promise.all(extractedDocuments.map(async document=>{
    const {data}=await supabase.storage.from("application-documents").createSignedUrl(document.storage_path,300);
    return{id:document.id,kind:document.kind,filename:document.original_filename,previewUrl:data?.signedUrl??null,provider:document.extraction_provider,fields:document.document_fields.map(field=>({id:field.id,name:field.field_name,sourceValue:primitive(field.source_value),normalizedValue:primitive(field.normalized_value),confidenceBps:field.confidence_bps,sourceLabel:field.source_label}))};
  }));
  const currentStep=progress.steps[progress.currentIndex].id;
  const extractionMode=getExtractionModeEnvironment().PROOFFLOW_EXTRACTION_MODE;
  return <ApplicationTaskLayout {...progress}><div className="page-enter"><div className="flex flex-wrap items-center gap-2"><StatusBadge status="neutral">{application.status.replaceAll("_"," ")}</StatusBadge><span className="text-xs font-semibold text-[var(--muted)]">{buyer?.name??"Private buyer"} · {amount}</span></div><div className="mt-4"><PageHeading eyebrow={`Application · ${application.id.slice(0,8).toUpperCase()}`} title={application.invoice_number??"Private draft"} description="Your details are saved. Continue one evidence step at a time; progress is kept securely in your hosted workspace."/></div><div className="mt-8"><ApplicationDetailsReceipt buyer={buyer?.name??"Private buyer"} purchaseOrder={application.purchase_order_reference} amount={amount} dueDate={application.invoice_due_on} consented={Boolean(application.ai_processing_consented_at)}/></div>{currentStep==="review"&&application.status==="documents_uploaded"&&<div className="mt-8"><ReviewReadyPanel applicationId={application.id} extractionMode={extractionMode}/></div>}{currentStep==="review"&&application.status==="fields_extracted"&&reviewDocuments.length===3&&<div className="mt-8"><ExtractionReviewWorkspace applicationId={application.id} documents={reviewDocuments}/></div>}<div className="mt-8"><DocumentUploadPanel applicationId={application.id} status={application.status} documents={storedDocuments}/></div></div></ApplicationTaskLayout>;
}

function primitive(value:unknown):string|boolean|null{return typeof value==="string"||typeof value==="boolean"?value:null;}
