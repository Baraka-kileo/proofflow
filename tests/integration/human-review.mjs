import { createHash, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url=process.env.PROOFFLOW_TEST_SUPABASE_URL;
const anonKey=process.env.PROOFFLOW_TEST_ANON_KEY;
const serviceKey=process.env.PROOFFLOW_TEST_SERVICE_ROLE_KEY;
const password=process.env.PROOFFLOW_DEMO_PASSWORD;
if(!url||!anonKey||!serviceKey||!password)throw new Error("Hosted review-test credentials are missing.");

const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
const sme=createClient(url,anonKey,{auth:{persistSession:false,autoRefreshToken:false}});
const buyer=createClient(url,anonKey,{auth:{persistSession:false,autoRefreshToken:false}});
const appId=randomUUID();
const ownerOrganizationId="11111111-1111-4111-8111-111111111111";
const buyerOrganizationId="22222222-2222-4222-8222-222222222222";

const templates={
  purchase_order:{buyer_legal_name:"Ubuntu Retail Group Demo",supplier_legal_name:"Ndlovu Office Supply Demo",purchase_order_reference:"PO-REVIEW-1042",issue_date:"2026-08-20",currency:"ZAR",order_total:"48750.25"},
  delivery_evidence:{buyer_legal_name:"Ubuntu Retail Group Demo",supplier_legal_name:"Ndlovu Office Supply Demo",purchase_order_reference:"PO-REVIEW-1042",delivery_or_completion_date:"2026-08-22",receiver_or_signature_present:true},
  invoice:{buyer_legal_name:"Ubuntu Retail Group Demo",supplier_legal_name:"Ndlovu Office Supply Demo",invoice_number:`INV-REVIEW-${Date.now()}`,purchase_order_reference:"PO-REVIEW-1042",issue_date:"2026-08-22",due_date:"2026-10-21",currency:"ZAR",subtotal:"42391.52",tax:"6358.73",total:"48750.25"},
};

const requireNoError=(error,label)=>{if(error)throw new Error(`${label}: ${error.message}`);};

try{
  const {data:smeAuth,error:smeAuthError}=await sme.auth.signInWithPassword({email:"sme.demo@proofflow.example",password});
  requireNoError(smeAuthError,"SME sign-in");
  const actorId=smeAuth.user.id;
  const {error:buyerAuthError}=await buyer.auth.signInWithPassword({email:"buyer.demo@proofflow.example",password});
  requireNoError(buyerAuthError,"buyer sign-in");

  const {error:appError}=await admin.from("applications").insert({id:appId,owner_organization_id:ownerOrganizationId,buyer_organization_id:buyerOrganizationId,created_by:actorId,title:"Atomic human review integration",status:"fields_extracted",currency:"ZAR",invoice_number:`INV-ATOMIC-${Date.now()}`,invoice_total_minor:4875025,purchase_order_reference:"PO-REVIEW-1042",ai_processing_consented_at:new Date().toISOString()});
  requireNoError(appError,"application fixture");

  const documents=Object.keys(templates).map(kind=>({id:randomUUID(),application_id:appId,owner_organization_id:ownerOrganizationId,uploaded_by:actorId,kind,original_filename:`${kind}.pdf`,storage_path:`review-integration/${appId}/${kind}.pdf`,mime_type:"application/pdf",byte_size:1024,sha256:createHash("sha256").update(`${appId}:${kind}`).digest("hex"),page_count:1,upload_completed_at:new Date().toISOString(),extraction_status:"extracted",extraction_schema_version:"extraction-v1",extraction_provider:"proofflow-demo-fixture",extraction_model:"deterministic-fixture-v1",extraction_completed_at:new Date().toISOString()}));
  const {error:documentError}=await admin.from("documents").insert(documents);
  requireNoError(documentError,"document fixtures");

  const fields=documents.flatMap(document=>Object.entries(templates[document.kind]).map(([field_name,value])=>({id:randomUUID(),document_id:document.id,field_name,source_value:value,normalized_value:value,confidence_bps:9500,source_label:field_name,review_status:"unreviewed"})));
  const {error:fieldError}=await admin.from("document_fields").insert(fields);
  requireNoError(fieldError,"field fixtures");

  const payload=fields.map((field,index)=>({id:field.id,value:index===0?`${field.normalized_value} Reviewed`:field.normalized_value}));
  const incomplete=await sme.rpc("submit_application_field_review",{target_application_id:appId,reviewed_fields:payload.slice(0,20)});
  if(!incomplete.error)throw new Error("Incomplete review was accepted.");

  const direct=await sme.from("document_fields").update({normalized_value:"Bypass"}).eq("id",fields[1].id).select("id");
  if(direct.error||direct.data.length!==0)throw new Error("Per-field review bypass was not blocked.");

  const first=await sme.rpc("submit_application_field_review",{target_application_id:appId,reviewed_fields:payload});
  requireNoError(first.error,"complete review");
  if(first.data?.fieldCount!==21||first.data?.correctedCount!==1||first.data?.replayed!==false)throw new Error("First review receipt was incorrect.");

  const [{data:storedApplication,error:storedApplicationError},{data:storedFields,error:storedFieldsError},{data:storedDocuments,error:storedDocumentsError},{count:auditCount,error:auditError}]=await Promise.all([
    admin.from("applications").select("status").eq("id",appId).single(),
    admin.from("document_fields").select("review_status,reviewed_by").in("id",fields.map(field=>field.id)),
    admin.from("documents").select("extraction_status").eq("application_id",appId),
    admin.from("audit_events").select("id",{count:"exact",head:true}).eq("application_id",appId).eq("action","application.fields_reviewed"),
  ]);
  requireNoError(storedApplicationError,"stored application");requireNoError(storedFieldsError,"stored fields");requireNoError(storedDocumentsError,"stored documents");requireNoError(auditError,"review audit");
  if(storedApplication.status!=="sme_reviewed"||storedFields.length!==21||storedFields.some(field=>field.review_status==="unreviewed"||field.reviewed_by!==actorId)||storedDocuments.some(document=>document.extraction_status!=="reviewed")||auditCount!==1)throw new Error("Atomic review state was incomplete.");

  const replay=await sme.rpc("submit_application_field_review",{target_application_id:appId,reviewed_fields:payload});
  requireNoError(replay.error,"idempotent review replay");
  if(replay.data?.replayed!==true)throw new Error("Repeat review was not identified as a replay.");
  const {count:replayedAuditCount,error:replayedAuditError}=await admin.from("audit_events").select("id",{count:"exact",head:true}).eq("application_id",appId).eq("action","application.fields_reviewed");
  requireNoError(replayedAuditError,"replay audit");
  if(replayedAuditCount!==1)throw new Error("Repeat review created a duplicate audit event.");

  const changed=payload.map((field,index)=>index===1?{...field,value:`${field.value} Changed`}:field);
  if(!(await sme.rpc("submit_application_field_review",{target_application_id:appId,reviewed_fields:changed})).error)throw new Error("Changed replay was accepted.");
  if(!(await buyer.rpc("submit_application_field_review",{target_application_id:appId,reviewed_fields:payload})).error)throw new Error("Buyer submitted an SME review.");

  process.stdout.write("Hosted atomic human-review checks passed.\n");
}finally{
  await admin.from("applications").delete().eq("id",appId);
  await sme.auth.signOut();
  await buyer.auth.signOut();
}
