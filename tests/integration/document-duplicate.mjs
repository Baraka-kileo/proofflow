import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url=process.env.PROOFFLOW_TEST_SUPABASE_URL;
const publishableKey=process.env.PROOFFLOW_TEST_PUBLISHABLE_KEY;
const serviceRoleKey=process.env.PROOFFLOW_TEST_SERVICE_ROLE_KEY;
if(!url||!publishableKey||!serviceRoleKey)throw new Error("Hosted duplicate-test credentials were not supplied.");
const admin=createClient(url,serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false}});
const run=crypto.randomUUID();
const password=`Proof-${run}-Aa1!`;
const userIds=[];
const organizationIds=[];

function assert(condition,message){if(!condition)throw new Error(message);}
async function cleanupStale(){
  const {data:organizations}=await admin.from("organizations").select("id").like("name","Exact Duplicate Demo%");
  for(const organization of organizations??[]){const {data:memberships}=await admin.from("memberships").select("profile_id").eq("organization_id",organization.id);await admin.from("applications").delete().eq("owner_organization_id",organization.id);await admin.from("organizations").delete().eq("id",organization.id);for(const membership of memberships??[])await admin.auth.admin.deleteUser(membership.profile_id);}
}

try{
  await cleanupStale();
  const identities=[
    {email:`duplicate-a-${run}@example.invalid`,name:"Exact Duplicate Demo User A"},
    {email:`duplicate-b-${run}@example.invalid`,name:"Exact Duplicate Demo User B"},
  ];
  for(const identity of identities){const {data,error}=await admin.auth.admin.createUser({email:identity.email,password,email_confirm:true});if(error)throw error;userIds.push(data.user.id);const {error:profileError}=await admin.from("profiles").insert({id:data.user.id,display_name:identity.name});if(profileError)throw profileError;}
  const {data:organizations,error:organizationsError}=await admin.from("organizations").insert([
    {name:"Exact Duplicate Demo Tenant A",slug:`duplicate-a-${run}`,kind:"sme",is_demo:true},
    {name:"Exact Duplicate Demo Tenant B",slug:`duplicate-b-${run}`,kind:"sme",is_demo:true},
    {name:"Exact Duplicate Demo Buyer",slug:`duplicate-buyer-${run}`,kind:"buyer",is_demo:true},
  ]).select("id,kind");
  if(organizationsError)throw organizationsError;
  const smeOrganizations=organizations.filter(item=>item.kind==="sme");
  const buyerOrganization=organizations.find(item=>item.kind==="buyer");
  organizationIds.push(...organizations.map(item=>item.id));
  for(let index=0;index<2;index++){const {error}=await admin.from("memberships").insert({organization_id:smeOrganizations[index].id,profile_id:userIds[index],role:"sme"});if(error)throw error;}
  const applications=[
    {owner_organization_id:smeOrganizations[0].id,buyer_organization_id:buyerOrganization.id,created_by:userIds[0],title:"Exact Duplicate Demo Original",invoice_number:`DUP-A1-${run}`,purchase_order_reference:"PO-DUP-A1",invoice_total_minor:10000,invoice_due_on:"2099-01-01",ai_processing_consented_at:new Date().toISOString()},
    {owner_organization_id:smeOrganizations[0].id,buyer_organization_id:buyerOrganization.id,created_by:userIds[0],title:"Exact Duplicate Demo Attempt",invoice_number:`DUP-A2-${run}`,purchase_order_reference:"PO-DUP-A2",invoice_total_minor:10000,invoice_due_on:"2099-01-01",ai_processing_consented_at:new Date().toISOString()},
    {owner_organization_id:smeOrganizations[1].id,buyer_organization_id:buyerOrganization.id,created_by:userIds[1],title:"Exact Duplicate Demo Other Tenant",invoice_number:`DUP-B1-${run}`,purchase_order_reference:"PO-DUP-B1",invoice_total_minor:10000,invoice_due_on:"2099-01-01",ai_processing_consented_at:new Date().toISOString()},
  ];
  const {data:createdApplications,error:applicationsError}=await admin.from("applications").insert(applications).select("id,owner_organization_id");if(applicationsError)throw applicationsError;
  const memberA=createClient(url,publishableKey,{auth:{persistSession:false,autoRefreshToken:false}});const memberB=createClient(url,publishableKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const [{error:signInAError},{error:signInBError}]=await Promise.all([memberA.auth.signInWithPassword({email:identities[0].email,password}),memberB.auth.signInWithPassword({email:identities[1].email,password})]);if(signInAError||signInBError)throw signInAError??signInBError;
  const sameBytes=new TextEncoder().encode("ProofFlow exact duplicate bytes");
  const sameHash=createHash("sha256").update(sameBytes).digest("hex");
  const foreignHash=createHash("sha256").update("Only tenant B owns these bytes").digest("hex");
  const appAOriginal=createdApplications[0],appAAttempt=createdApplications[1],appB=createdApplications[2];
  const originalDocumentId=crypto.randomUUID();
  const {error:originalError}=await memberA.from("documents").insert({id:originalDocumentId,application_id:appAOriginal.id,owner_organization_id:smeOrganizations[0].id,uploaded_by:userIds[0],kind:"purchase_order",original_filename:"original-proof.pdf",storage_path:`${smeOrganizations[0].id}/${appAOriginal.id}/${originalDocumentId}/original-proof.pdf`,mime_type:"application/pdf",byte_size:sameBytes.byteLength,sha256:sameHash,page_count:1,upload_completed_at:new Date().toISOString()});if(originalError)throw originalError;
  const {data:runId,error:recordError}=await memberA.rpc("record_exact_document_duplicate",{target_application_id:appAAttempt.id,attempted_filename:"same-bytes-renamed.pdf",content_sha256:sameHash});if(recordError)throw recordError;
  const {data:check,error:checkError}=await memberA.from("verification_checks").select("rule_code,result,evidence").eq("verification_run_id",runId).single();if(checkError)throw checkError;
  assert(check.rule_code==="V009"&&check.result==="fail","Renamed identical bytes did not produce a persisted V009 fail.");
  assert(check.evidence.attemptedFilename==="same-bytes-renamed.pdf"&&check.evidence.duplicateScope==="same_organization","V009 evidence is missing its generic same-organization context.");
  const {count:prematureCount}=await memberA.from("documents").select("id",{count:"exact",head:true}).eq("application_id",appAAttempt.id);assert(prematureCount===0,"Duplicate evidence reached the extraction document set.");
  for(const [kind,hash,label] of [["purchase_order",sameHash,"same-hash-other-tenant.pdf"],["delivery_evidence",foreignHash,"foreign-only.pdf"]]){const id=crypto.randomUUID();const {error}=await memberB.from("documents").insert({id,application_id:appB.id,owner_organization_id:smeOrganizations[1].id,uploaded_by:userIds[1],kind,original_filename:label,storage_path:`${smeOrganizations[1].id}/${appB.id}/${id}/${label}`,mime_type:"application/pdf",byte_size:32,sha256:hash,page_count:1,upload_completed_at:new Date().toISOString()});if(error)throw error;}
  const {count:foreignVisibility}=await memberA.from("documents").select("id",{count:"exact",head:true}).eq("sha256",foreignHash);assert(foreignVisibility===0,"Tenant A could see Tenant B's matching hash row.");
  const {error:foreignProbeError}=await memberA.rpc("record_exact_document_duplicate",{target_application_id:appAAttempt.id,attempted_filename:"probe.pdf",content_sha256:foreignHash});assert(foreignProbeError?.code==="23514","A cross-tenant hash probe disclosed or recorded another tenant's document.");
  console.log("PASS: trusted-hash V009 is persisted before extraction and cross-tenant hashes remain undisclosed.");
}finally{
  for(const organizationId of organizationIds.filter((_,index)=>index<2))await admin.from("applications").delete().eq("owner_organization_id",organizationId);
  for(const organizationId of organizationIds)await admin.from("organizations").delete().eq("id",organizationId);
  for(const userId of userIds)await admin.auth.admin.deleteUser(userId);
}
