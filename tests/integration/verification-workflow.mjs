import { createHash, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url=process.env.PROOFFLOW_TEST_SUPABASE_URL;
const anonKey=process.env.PROOFFLOW_TEST_PUBLISHABLE_KEY;
const serviceKey=process.env.PROOFFLOW_TEST_SERVICE_ROLE_KEY;
const password=process.env.PROOFFLOW_TEST_PASSWORD;
if(!url||!anonKey||!serviceKey||!password)throw new Error("Hosted verification-test configuration is missing.");

const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
const sme=createClient(url,anonKey,{auth:{persistSession:false,autoRefreshToken:false}});
const buyer=createClient(url,anonKey,{auth:{persistSession:false,autoRefreshToken:false}});
const ownerOrganizationId="11111111-1111-4111-8111-111111111111";
const buyerOrganizationId="22222222-2222-4222-8222-222222222222";
const appIds=[];
const unique=Date.now();
const keepFixture=process.env.PROOFFLOW_KEEP_TEST_FIXTURE==="1";

const requireNoError=(error,label)=>{if(error)throw new Error(`${label}: ${error.message}`);};

async function createReviewedFixture(actorId,invoiceNumber){
  const appId=randomUUID();appIds.push(appId);
  const {error:appError}=await admin.from("applications").insert({id:appId,owner_organization_id:ownerOrganizationId,buyer_organization_id:buyerOrganizationId,created_by:actorId,title:"Verification integration fixture",status:"sme_reviewed",currency:"ZAR",invoice_number:invoiceNumber,invoice_total_minor:4875025,purchase_order_reference:`PO-VERIFY-${unique}`,invoice_issued_on:"2026-08-22",invoice_due_on:"2026-10-21"});
  requireNoError(appError,"application fixture");
  const templates={
    purchase_order:{buyer_legal_name:"Ubuntu Retail Group",supplier_legal_name:"Ndlovu Office Supplies",purchase_order_reference:`PO-VERIFY-${unique}`,issue_date:"2026-08-20",currency:"ZAR",order_total:"48750.25"},
    delivery_evidence:{buyer_legal_name:"Ubuntu Retail Group",supplier_legal_name:"Ndlovu Office Supplies",purchase_order_reference:`PO-VERIFY-${unique}`,delivery_or_completion_date:"2026-08-21",receiver_or_signature_present:true},
    invoice:{buyer_legal_name:"Ubuntu Retail Group",supplier_legal_name:"Ndlovu Office Supplies",invoice_number:invoiceNumber,purchase_order_reference:`PO-VERIFY-${unique}`,issue_date:"2026-08-22",due_date:"2026-10-21",currency:"ZAR",subtotal:"42391.52",tax:"6358.73",total:"48750.25"},
  };
  const documents=Object.keys(templates).map(kind=>({id:randomUUID(),application_id:appId,owner_organization_id:ownerOrganizationId,uploaded_by:actorId,kind,original_filename:`${kind}.pdf`,storage_path:`verification-integration/${appId}/${kind}.pdf`,mime_type:"application/pdf",byte_size:1024,sha256:createHash("sha256").update(`${appId}:${kind}`).digest("hex"),page_count:1,upload_completed_at:new Date().toISOString(),extraction_status:"reviewed",extraction_schema_version:"evidence-entry-v1",extraction_provider:"manual-entry",extraction_model:null,extraction_completed_at:null,entry_method:"manual"}));
  const {error:documentError}=await admin.from("documents").insert(documents);requireNoError(documentError,"document fixtures");
  const fields=documents.flatMap(document=>Object.entries(templates[document.kind]).map(([field_name,value])=>({id:randomUUID(),document_id:document.id,field_name,source_value:value,normalized_value:value,confidence_bps:9500,source_label:field_name,review_status:"accepted",reviewed_by:actorId,reviewed_at:new Date().toISOString()})));
  const {error:fieldError}=await admin.from("document_fields").insert(fields);requireNoError(fieldError,"field fixtures");
  return {appId,documents};
}

function checks(documents,{duplicate=false}={}){
  return Array.from({length:12},(_,index)=>{
    const ruleId=`V${String(index+1).padStart(3,"0")}`;
    const status=ruleId==="V010"&&duplicate?"fail":ruleId==="V012"?"review":"pass";
    return{ruleId,version:"verification-v1",status,severity:status==="fail"?"blocking":status==="review"?"warning":"info",title:`Rule ${ruleId}`,explanation:`Deterministic result for ${ruleId}.`,comparedValues:{Result:status},sourceDocumentIds:ruleId==="V012"?[]:documents.map(document=>document.id)};
  });
}

try{
  const {data:smeAuth,error:smeAuthError}=await sme.auth.signInWithPassword({email:"sme.demo@proofflow.example",password});requireNoError(smeAuthError,"SME sign-in");
  const {error:buyerAuthError}=await buyer.auth.signInWithPassword({email:"buyer.demo@proofflow.example",password});requireNoError(buyerAuthError,"buyer sign-in");
  const actorId=smeAuth.user.id;
  const invoiceNumber=`INV-VERIFY-${unique}`;
  const first=await createReviewedFixture(actorId,invoiceNumber);
  const completeChecks=checks(first.documents);

  const invalid=await sme.rpc("persist_verification_run_v1",{target_application_id:first.appId,target_rule_version:"verification-v1",target_overall_result:"review",target_normalized_invoice_number:`INVVERIFY${unique}`,checks:completeChecks.slice(0,11)});
  if(!invalid.error)throw new Error("An incomplete verification run was accepted.");
  const {count:invalidCount,error:invalidCountError}=await admin.from("verification_runs").select("id",{count:"exact",head:true}).eq("application_id",first.appId);requireNoError(invalidCountError,"invalid-run count");
  if(invalidCount!==0)throw new Error("A failed transaction left a partial verification run.");

  const saved=await sme.rpc("persist_verification_run_v1",{target_application_id:first.appId,target_rule_version:"verification-v1",target_overall_result:"review",target_normalized_invoice_number:`INVVERIFY${unique}`,checks:completeChecks});requireNoError(saved.error,"complete verification");
  const rerun=await sme.rpc("persist_verification_run_v1",{target_application_id:first.appId,target_rule_version:"verification-v1",target_overall_result:"review",target_normalized_invoice_number:`INVVERIFY${unique}`,checks:completeChecks});requireNoError(rerun.error,"versioned rerun");
  if(saved.data===rerun.data)throw new Error("A rerun rewrote the original run.");
  const [{data:storedRuns,error:runsError},{count:storedChecks,error:checksError},{data:storedApplication,error:applicationError}]=await Promise.all([admin.from("verification_runs").select("id,rule_version,overall_result").eq("application_id",first.appId),admin.from("verification_checks").select("id",{count:"exact",head:true}).eq("application_id",first.appId),admin.from("applications").select("status,normalized_invoice_number").eq("id",first.appId).single()]);
  requireNoError(runsError,"stored runs");requireNoError(checksError,"stored checks");requireNoError(applicationError,"stored application");
  if(storedRuns.length!==2||storedChecks!==24||storedApplication.status!=="checks_complete"||storedApplication.normalized_invoice_number!==`INVVERIFY${unique}`)throw new Error("Versioned verification persistence is incomplete.");

  if(!(await buyer.rpc("send_application_to_buyer",{target_application_id:first.appId})).error)throw new Error("Buyer invoked the SME send transition.");
  const sent=await sme.rpc("send_application_to_buyer",{target_application_id:first.appId});requireNoError(sent.error,"send to buyer");
  const replay=await sme.rpc("send_application_to_buyer",{target_application_id:first.appId});requireNoError(replay.error,"send replay");
  if(sent.data!==replay.data)throw new Error("Send replay created a second confirmation identity.");
  const [{data:sentApplication,error:sentApplicationError},{count:confirmationCount,error:confirmationCountError},{count:sendAuditCount,error:sendAuditError}]=await Promise.all([admin.from("applications").select("status").eq("id",first.appId).single(),admin.from("confirmations").select("id",{count:"exact",head:true}).eq("application_id",first.appId),admin.from("audit_events").select("id",{count:"exact",head:true}).eq("application_id",first.appId).eq("action","application.sent_to_buyer")]);
  requireNoError(sentApplicationError,"sent application");requireNoError(confirmationCountError,"confirmation count");requireNoError(sendAuditError,"send audit");
  if(sentApplication.status!=="buyer_pending"||confirmationCount!==1||sendAuditCount!==1)throw new Error("Buyer handoff was not idempotent.");

  const duplicate=await createReviewedFixture(actorId,`inv verify ${unique}`);
  const duplicateChecks=checks(duplicate.documents,{duplicate:true});
  const duplicateSaved=await sme.rpc("persist_verification_run_v1",{target_application_id:duplicate.appId,target_rule_version:"verification-v1",target_overall_result:"fail",target_normalized_invoice_number:`INVVERIFY${unique}`,checks:duplicateChecks});requireNoError(duplicateSaved.error,"duplicate verification");
  if(!(await sme.rpc("send_application_to_buyer",{target_application_id:duplicate.appId})).error)throw new Error("A failed duplicate pack was sent to the buyer.");

  process.stdout.write(`Hosted deterministic verification, duplicate, transaction, authorization, and buyer-handoff checks passed.${keepFixture?` Visual application: ${first.appId}`:""}\n`);
}finally{
  if(appIds.length&&!keepFixture)await admin.from("applications").delete().in("id",appIds);
  await sme.auth.signOut();await buyer.auth.signOut();
}
