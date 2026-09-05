import { createClient } from "@supabase/supabase-js";

const url=process.env.PROOFFLOW_TEST_SUPABASE_URL;const anonKey=process.env.PROOFFLOW_TEST_PUBLISHABLE_KEY;const password=process.env.PROOFFLOW_DEMO_PASSWORD;
if(!url||!anonKey||!password)throw new Error("Hosted buyer-confirmation test configuration is missing.");
const buyer=createClient(url,anonKey,{auth:{persistSession:false,autoRefreshToken:false}});const sme=createClient(url,anonKey,{auth:{persistSession:false,autoRefreshToken:false}});
const confirmationId="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",applicationId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2";
const requireNoError=(error,label)=>{if(error)throw new Error(`${label}: ${error.message}`);};

try{
  requireNoError((await buyer.auth.signInWithPassword({email:"buyer.demo@proofflow.example",password})).error,"buyer sign-in");
  const {data:confirmation,error:confirmationError}=await buyer.from("confirmations").select("status,approval_id,answers,answer_explanations,representative_job_title,declaration_version,signature_strokes,decision_payload_hash").eq("id",confirmationId).single();requireNoError(confirmationError,"confirmation receipt");
  if(confirmation.status!=="confirmed"||!confirmation.approval_id||!confirmation.signature_strokes||!confirmation.decision_payload_hash)throw new Error("Signed immutable confirmation is incomplete.");
  const replay=await buyer.rpc("submit_buyer_confirmation_v1",{target_confirmation_id:confirmationId,submitted_answers:confirmation.answers,submitted_explanations:confirmation.answer_explanations,submitted_job_title:confirmation.representative_job_title,submitted_declaration_version:confirmation.declaration_version,submitted_signature_strokes:confirmation.signature_strokes});requireNoError(replay.error,"exact replay");if(!replay.data.replayed)throw new Error("Exact replay was not identified as idempotent.");
  const changed=await buyer.rpc("submit_buyer_confirmation_v1",{target_confirmation_id:confirmationId,submitted_answers:{...confirmation.answers,paymentDateCorrect:false},submitted_explanations:{paymentDateCorrect:"The date differs in our ledger."},submitted_job_title:null,submitted_declaration_version:null,submitted_signature_strokes:null});if(!changed.error)throw new Error("Changed replay rewrote an immutable decision.");
  const {data:runs,error:runsError}=await buyer.from("verification_runs").select("id,verification_checks(rule_code,result)").eq("application_id",applicationId).eq("status","completed").order("completed_at",{ascending:false}).limit(1);requireNoError(runsError,"V012 run");if(runs.length!==1||runs[0].verification_checks.length!==12||runs[0].verification_checks.find(check=>check.rule_code==="V012")?.result!=="pass")throw new Error("V012 confirmation rerun is incomplete.");
  const {count:auditCount,error:auditError}=await buyer.from("audit_events").select("id",{count:"exact",head:true}).eq("application_id",applicationId).eq("action","buyer.confirmation_signed");requireNoError(auditError,"confirmation audit");if(auditCount!==1)throw new Error("Signed confirmation audit event is missing or duplicated.");
  requireNoError((await sme.auth.signInWithPassword({email:"sme.demo@proofflow.example",password})).error,"SME sign-in");
  const wrongRole=await sme.rpc("submit_buyer_confirmation_v1",{target_confirmation_id:confirmationId,submitted_answers:confirmation.answers,submitted_explanations:confirmation.answer_explanations,submitted_job_title:confirmation.representative_job_title,submitted_declaration_version:confirmation.declaration_version,submitted_signature_strokes:confirmation.signature_strokes});if(!wrongRole.error)throw new Error("SME account submitted a buyer decision.");
  process.stdout.write("Hosted buyer confirmation receipt, V012, audit, replay, tamper, and role checks passed.\n");
}finally{await buyer.auth.signOut();await sme.auth.signOut();}
