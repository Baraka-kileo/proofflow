import { createHash, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url=process.env.PROOFFLOW_TEST_SUPABASE_URL;
const publicKey=process.env.PROOFFLOW_TEST_PUBLISHABLE_KEY;
const serviceKey=process.env.PROOFFLOW_TEST_SERVICE_ROLE_KEY;
const password=process.env.PROOFFLOW_DEMO_PASSWORD;
if(!url||!publicKey||!serviceKey||!password)throw new Error("Hosted extraction test credentials were not supplied.");

const member=createClient(url,publicKey,{auth:{persistSession:false,autoRefreshToken:false}});
const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
const {data:auth,error:authError}=await member.auth.signInWithPassword({email:"sme.demo@proofflow.example",password});
if(authError)throw authError;

const organizationId="11111111-1111-4111-8111-111111111111";
const buyerId="22222222-2222-4222-8222-222222222222";
const applicationId=randomUUID();
const documentId=randomUUID();
const suffix=Date.now();
const raw={schemaVersion:"extraction-v1",documentKind:"invoice",fields:{
  buyerLegalName:{value:"Ubuntu Retail Group Demo",confidenceBps:9000,sourceLabel:"Bill to"},
  supplierLegalName:{value:"Ndlovu Office Supply Demo",confidenceBps:9000,sourceLabel:"Supplier"},
  invoiceNumber:{value:`INV-EXTRACT-${suffix}`,confidenceBps:9500,sourceLabel:"Invoice number"},
  purchaseOrderReference:{value:`PO-EXTRACT-${suffix}`,confidenceBps:9300,sourceLabel:"PO reference"},
  issueDate:{value:"2026-09-01",confidenceBps:9100,sourceLabel:"Invoice date"},
  dueDate:{value:"2026-10-31",confidenceBps:9100,sourceLabel:"Due date"},
  currency:{value:"ZAR",confidenceBps:9900,sourceLabel:"Currency"},
  subtotal:{value:"1000.00",confidenceBps:9200,sourceLabel:"Subtotal"},
  tax:{value:"150.00",confidenceBps:9200,sourceLabel:"VAT"},
  total:{value:"1150.00",confidenceBps:9700,sourceLabel:"Total"},
}};
const normalized=Object.fromEntries(Object.entries(raw.fields).map(([name,field])=>[name,field.value]));
const rpcArgs={target_document_id:documentId,target_actor_profile_id:auth.user.id,raw_extraction:raw,normalized_fields:normalized,provider_name:"google-gemini",provider_model:"synthetic-gemini-test",provider_metadata:{responseId:"synthetic-response",totalTokenCount:123}};

try{
  const {error:applicationError}=await admin.from("applications").insert({id:applicationId,owner_organization_id:organizationId,buyer_organization_id:buyerId,created_by:auth.user.id,title:"Synthetic extraction persistence test",purchase_order_reference:`PO-EXTRACT-${suffix}`,invoice_number:`INV-EXTRACT-${suffix}`,invoice_total_minor:115000,requested_amount_minor:90000,currency:"ZAR",invoice_due_on:"2026-10-31",ai_processing_consented_at:new Date().toISOString(),status:"documents_uploaded"});
  if(applicationError)throw applicationError;
  const hash=createHash("sha256").update(`extraction-${suffix}`).digest("hex");
  const {error:documentError}=await admin.from("documents").insert({id:documentId,application_id:applicationId,owner_organization_id:organizationId,uploaded_by:auth.user.id,kind:"invoice",original_filename:"synthetic-invoice.pdf",storage_path:`${organizationId}/${applicationId}/${documentId}/synthetic-invoice.pdf`,mime_type:"application/pdf",byte_size:128,sha256:hash,page_count:1,upload_completed_at:new Date().toISOString()});
  if(documentError)throw documentError;

  const {error:memberRpcError}=await member.rpc("persist_document_extraction_v1",rpcArgs);
  if(!memberRpcError)throw new Error("Authenticated browser role could invoke the server-only extraction writer.");

  for(let attempt=0;attempt<2;attempt+=1){const {error}=await admin.rpc("persist_document_extraction_v1",rpcArgs);if(error)throw error;}
  const {data:fields,error:fieldsError}=await admin.from("document_fields").select("field_name,source_value,normalized_value,confidence_bps,source_label,review_status").eq("document_id",documentId);
  if(fieldsError)throw fieldsError;
  if(fields.length!==10)throw new Error(`Expected one idempotent 10-field set, received ${fields.length}.`);
  const total=fields.find(field=>field.field_name==="total");
  if(total?.source_value!=="1150.00"||total.normalized_value!=="1150.00"||total.source_label!=="Total"||total.review_status!=="unreviewed")throw new Error("Persisted extraction fields did not retain candidate provenance.");
  const {data:document,error:readError}=await admin.from("documents").select("extraction_status,extraction_schema_version,extraction_provider,extraction_model,extraction_response,extraction_provider_metadata,extraction_completed_at").eq("id",documentId).single();
  if(readError)throw readError;
  if(document.extraction_status!=="extracted"||document.extraction_schema_version!=="extraction-v1"||document.extraction_provider!=="google-gemini"||!document.extraction_completed_at)throw new Error("Document extraction receipt was not saved.");
  console.log("PASS: server-only extraction persistence is atomic and retry-idempotent.");
}finally{
  await admin.from("applications").delete().eq("id",applicationId);
}
