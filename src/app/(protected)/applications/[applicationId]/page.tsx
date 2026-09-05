import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { StatusBadge } from "@/components/status-badge";
import { ApplicationTaskLayout } from "@/features/applications/application-task-layout";
import { ApplicationDetailsReceipt } from "@/features/applications/application-details-receipt";
import { DocumentUploadPanel } from "@/features/applications/document-upload-panel";
import { ExtractionReviewWorkspace, type ReviewDocument } from "@/features/applications/extraction-review-workspace";
import { ReviewReadyPanel } from "@/features/applications/review-ready-panel";
import { VerificationPanel } from "@/features/applications/verification-panel";
import { ApplicationActivity } from "@/features/applications/application-activity";
import { requireApplicationAccess } from "@/lib/auth/dal";
import { deriveApplicationProgress } from "@/lib/applications/progress";
import { getExtractionModeEnvironment } from "@/lib/env/server";
import { createClient } from "@/lib/supabase/server";
import type { VerificationCheck, VerificationStatus } from "@/lib/verification/rules-v1";

export const metadata:Metadata={title:"Application"};

export default async function ApplicationPage({params}:{params:Promise<{applicationId:string}>}){
  const {application}=await requireApplicationAccess((await params).applicationId);
  const supabase=await createClient();
  const [{data:documents,error:documentsError},{data:buyer,error:buyerError},{data:verificationRuns,error:verificationError},{data:auditEvents,error:auditError}]=await Promise.all([
    supabase.from("documents").select("id,kind,original_filename,storage_path,byte_size,page_count,upload_completed_at,extraction_status,extraction_provider,document_fields(id,field_name,source_value,normalized_value,confidence_bps,source_label)").eq("application_id",application.id),
    supabase.from("organizations").select("name").eq("id",application.buyer_organization_id).maybeSingle(),
    supabase.from("verification_runs").select("id,overall_result,completed_at,rule_version,verification_checks(rule_code,result,explanation,evidence)").eq("application_id",application.id).eq("status","completed").eq("rule_version","verification-v1").order("completed_at",{ascending:false}).limit(1),
    supabase.from("audit_events").select("id,action,created_at").eq("application_id",application.id).order("created_at",{ascending:false}).limit(20),
  ]);
  if(documentsError||buyerError||verificationError||auditError)throw new Error("Unable to load the private application workflow.");
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
  const latestRun=verificationRuns?.[0]??null;
  const checks=(latestRun?.verification_checks??[]).map(check=>parseVerificationCheck(check.evidence)).filter((check):check is VerificationCheck=>check!==null).sort((a,b)=>a.ruleId.localeCompare(b.ruleId));
  const overallResult=latestRun?.overall_result as VerificationStatus|null|undefined;
  const showVerification=["sme_reviewed","checks_complete","buyer_pending","buyer_confirmed","buyer_disputed","funder_review","offer_made","offer_accepted","offer_declined","funded_simulated"].includes(application.status);
  const sourceDocuments=storedDocuments.map(document=>({id:document.id,label:document.kind==="purchase_order"?"purchase order":document.kind==="delivery_evidence"?"delivery evidence":"invoice"}));
  return <ApplicationTaskLayout {...progress}><div className="page-enter"><div className="flex flex-wrap items-center gap-2"><StatusBadge status="neutral">{application.status.replaceAll("_"," ")}</StatusBadge><span className="text-xs font-semibold text-[var(--muted)]">{buyer?.name??"Private buyer"} · {amount}</span></div><div className="mt-4"><PageHeading eyebrow={`Application · ${application.id.slice(0,8).toUpperCase()}`} title={application.invoice_number??"Private draft"} description="Your details are saved. Continue one evidence step at a time; progress is kept securely in your hosted workspace."/></div><div className="mt-8"><ApplicationDetailsReceipt buyer={buyer?.name??"Private buyer"} purchaseOrder={application.purchase_order_reference} amount={amount} dueDate={application.invoice_due_on} consented={Boolean(application.ai_processing_consented_at)}/></div>{currentStep==="review"&&application.status==="documents_uploaded"&&<div className="mt-8"><ReviewReadyPanel applicationId={application.id} extractionMode={extractionMode}/></div>}{currentStep==="review"&&application.status==="fields_extracted"&&reviewDocuments.length===3&&<div className="mt-8"><ExtractionReviewWorkspace applicationId={application.id} documents={reviewDocuments}/></div>}{showVerification&&<div className="mt-8"><VerificationPanel applicationId={application.id} status={application.status} overallResult={overallResult??null} checks={checks} completedAt={latestRun?.completed_at??null} sourceDocuments={sourceDocuments}/></div>}<div className="mt-8"><DocumentUploadPanel applicationId={application.id} status={application.status} documents={storedDocuments}/></div><div className="mt-8"><ApplicationActivity events={(auditEvents??[]).map(event=>({id:event.id,action:event.action,createdAt:event.created_at}))}/></div></div></ApplicationTaskLayout>;
}

function primitive(value:unknown):string|boolean|null{return typeof value==="string"||typeof value==="boolean"?value:null;}

function parseVerificationCheck(value:unknown):VerificationCheck|null{
  if(!value||typeof value!=="object"||Array.isArray(value))return null;
  const check=value as Record<string,unknown>;
  if(typeof check.ruleId!=="string"||!/^V\d{3}$/.test(check.ruleId)||check.version!=="verification-v1"||!['pass','review','fail'].includes(String(check.status))||!['info','warning','blocking'].includes(String(check.severity))||typeof check.title!=="string"||typeof check.explanation!=="string"||!check.comparedValues||typeof check.comparedValues!=="object"||Array.isArray(check.comparedValues)||!Array.isArray(check.sourceDocumentIds))return null;
  const comparedValues=Object.fromEntries(Object.entries(check.comparedValues as Record<string,unknown>).filter((entry):entry is [string,string|null]=>entry[1]===null||typeof entry[1]==="string"));
  const sourceDocumentIds=check.sourceDocumentIds.filter((id):id is string=>typeof id==="string");
  return{ruleId:check.ruleId as VerificationCheck["ruleId"],version:"verification-v1",status:check.status as VerificationCheck["status"],severity:check.severity as VerificationCheck["severity"],title:check.title,explanation:check.explanation,comparedValues,sourceDocumentIds};
}
