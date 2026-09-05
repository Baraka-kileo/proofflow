import { createClient } from "@supabase/supabase-js";

const url = process.env.PROOFFLOW_TEST_SUPABASE_URL;
const serviceRoleKey = process.env.PROOFFLOW_TEST_SERVICE_ROLE_KEY;
const password = process.env.PROOFFLOW_TEST_PASSWORD;
if (!url || !serviceRoleKey || !password) throw new Error("Seed provisioning credentials are missing.");

const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
const { error: organizationsError } = await admin.from("organizations").upsert([
  { id: "11111111-1111-4111-8111-111111111111", name: "Ndlovu Office Supplies", slug: "ndlovu-office-supplies", kind: "sme", registration_number: "2024/000101/07", is_demo: false },
  { id: "22222222-2222-4222-8222-222222222222", name: "Ubuntu Retail Group", slug: "ubuntu-retail-group", kind: "buyer", registration_number: "2022/000202/07", is_demo: false },
  { id: "33333333-3333-4333-8333-333333333333", name: "Cape Growth Finance", slug: "cape-growth-finance", kind: "funder", registration_number: "2023/000303/07", is_demo: false },
  { id: "44444444-4444-4444-8444-444444444444", name: "Mokoena Catering Services", slug: "mokoena-catering-services", kind: "sme", registration_number: "2024/000404/07", is_demo: false },
]);
if (organizationsError) throw organizationsError;
const identities = [
  { email: "sme.test@proofflow.example", name: "Amara Ndlovu", role: "sme", organization_id: "11111111-1111-4111-8111-111111111111" },
  { email: "buyer.test@proofflow.example", name: "Lebo Molefe", role: "buyer", organization_id: "22222222-2222-4222-8222-222222222222" },
  { email: "funder.test@proofflow.example", name: "Thandi Khumalo", role: "funder", organization_id: "33333333-3333-4333-8333-333333333333" },
];
const usersByRole = {};

for (const identity of identities) {
  const { data: listed, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw listError;
  let user = listed.users.find((candidate) => candidate.email === identity.email);
  if (user) {
    const { data, error } = await admin.auth.admin.updateUserById(user.id, { password, email_confirm: true });
    if (error) throw error;
    user = data.user;
  } else {
    const { data, error } = await admin.auth.admin.createUser({ email: identity.email, password, email_confirm: true });
    if (error) throw error;
    user = data.user;
  }
  const { error: profileError } = await admin.from("profiles").upsert({ id: user.id, display_name: identity.name });
  if (profileError) throw profileError;
  const { error: membershipError } = await admin.from("memberships").upsert(
    { organization_id: identity.organization_id, profile_id: user.id, role: identity.role },
    { onConflict: "organization_id,profile_id" },
  );
  if (membershipError) throw membershipError;
  usersByRole[identity.role] = user.id;
}

const applications = [
  { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1", owner_organization_id: "11111111-1111-4111-8111-111111111111", buyer_organization_id: "22222222-2222-4222-8222-222222222222", created_by: usersByRole.sme, title: "Ubuntu stationery delivery", status: "buyer_confirmed", currency: "ZAR", purchase_order_reference:"PO-2039", invoice_number: "INV-2039", invoice_total_minor: 4875000, requested_amount_minor: 3900000, invoice_issued_on: "2026-08-20", invoice_due_on: "2026-10-19", submitted_at: "2026-09-04T09:00:00Z" },
  { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2", owner_organization_id: "11111111-1111-4111-8111-111111111111", buyer_organization_id: "22222222-2222-4222-8222-222222222222", created_by: usersByRole.sme, title: "Office paper order", status: "buyer_pending", currency: "ZAR", purchase_order_reference:"PO-2040", invoice_number: "INV-2040", invoice_total_minor: 2240000, requested_amount_minor: 1792000, invoice_issued_on: "2026-08-28", invoice_due_on: "2026-10-27", submitted_at: "2026-09-04T22:00:00Z" },
  { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3", owner_organization_id: "44444444-4444-4444-8444-444444444444", buyer_organization_id: "22222222-2222-4222-8222-222222222222", created_by: usersByRole.sme, title: "Catering completion", status: "buyer_pending", currency: "ZAR", purchase_order_reference:"PO-1184", invoice_number: "INV-1184", invoice_total_minor: 1875000, requested_amount_minor: 1500000, invoice_issued_on: "2026-08-25", invoice_due_on: "2026-10-24", submitted_at: "2026-09-04T07:00:00Z" },
  { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4", owner_organization_id: "44444444-4444-4444-8444-444444444444", buyer_organization_id: "22222222-2222-4222-8222-222222222222", created_by: usersByRole.sme, title: "Training catering", status: "buyer_confirmed", currency: "ZAR", purchase_order_reference:"PO-1180", invoice_number: "INV-1180", invoice_total_minor: 8230000, requested_amount_minor: 6584000, invoice_issued_on: "2026-08-10", invoice_due_on: "2026-10-09", submitted_at: "2026-09-03T10:00:00Z" },
];
const { error: applicationsError } = await admin.from("applications").upsert(applications);
if (applicationsError) throw applicationsError;

const yesAnswers={poIssued:true,deliveryAccepted:true,invoiceRecognized:true,amountCorrect:true,invoiceOutstanding:true,paymentDateCorrect:true};
const confirmations = [
  { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1", application_id: applications[0].id, buyer_organization_id: "22222222-2222-4222-8222-222222222222", status: "confirmed", order_recognized: true, delivery_received: true, amount_recognized: true, answers:yesAnswers,answer_explanations:{},transaction_snapshot:{buyer:"Ubuntu Retail Group",supplier:"Ndlovu Office Supplies",purchaseOrder:"PO-2039",invoice:"INV-2039",currency:"ZAR",invoiceAmountMinor:4875000,outstandingAmountMinor:4875000,expectedPaymentDate:"2026-10-19"},declaration_version:"buyer-declaration-v1",representative_name:"Lebo Molefe",representative_job_title:"Accounts Payable Manager",representative_company:"Ubuntu Retail Group",representative_email:"buyer.test@proofflow.example",signature_strokes:[[{x:.08,y:.65},{x:.23,y:.25},{x:.4,y:.72},{x:.61,y:.3},{x:.9,y:.55}]],approval_id:"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1",decision_payload_hash:"seed-confirmation-1",decided_by: usersByRole.buyer, decided_at: "2026-09-05T05:48:00Z" },
  { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2", application_id: applications[1].id, buyer_organization_id: "22222222-2222-4222-8222-222222222222", status: "pending" },
  { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3", application_id: applications[2].id, buyer_organization_id: "22222222-2222-4222-8222-222222222222", status: "pending" },
  { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4", application_id: applications[3].id, buyer_organization_id: "22222222-2222-4222-8222-222222222222", status: "confirmed", order_recognized: true, delivery_received: true, amount_recognized: true, answers:yesAnswers,answer_explanations:{},transaction_snapshot:{buyer:"Ubuntu Retail Group",supplier:"Mokoena Catering Services",purchaseOrder:"PO-1180",invoice:"INV-1180",currency:"ZAR",invoiceAmountMinor:8230000,outstandingAmountMinor:8230000,expectedPaymentDate:"2026-10-09"},declaration_version:"buyer-declaration-v1",representative_name:"Lebo Molefe",representative_job_title:"Finance Manager",representative_company:"Ubuntu Retail Group",representative_email:"buyer.test@proofflow.example",signature_strokes:[[{x:.08,y:.65},{x:.23,y:.25},{x:.4,y:.72},{x:.61,y:.3},{x:.9,y:.55}]],approval_id:"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee4",decision_payload_hash:"seed-confirmation-4",decided_by: usersByRole.buyer, decided_at: "2026-09-05T04:00:00Z" },
];
const { error: confirmationsError } = await admin.from("confirmations").upsert(confirmations,{onConflict:"id",ignoreDuplicates:true});
if (confirmationsError) throw confirmationsError;

const runs = applications.map((application,index)=>({id:`cccccccc-cccc-4ccc-9ccc-ccccccccccc${index+1}`,application_id:application.id,initiated_by:usersByRole.sme,status:"completed",started_at:"2026-09-04T09:05:00Z",completed_at:"2026-09-04T09:06:00Z",rule_version:"verification-v1",overall_result:"pass"}));
const { error: runsError } = await admin.from("verification_runs").upsert(runs);
if (runsError) throw runsError;
const checkRows=runs.flatMap((run,runIndex)=>Array.from({length:12},(_,ruleIndex)=>{const ruleCode=`V${String(ruleIndex+1).padStart(3,"0")}`;return{id:`${String(runIndex+1).repeat(8)}-${String(ruleIndex+1).padStart(4,"0")}-4ddd-8ddd-${String(runIndex+1).repeat(11)}${(ruleIndex+1)%10}`,verification_run_id:run.id,application_id:run.application_id,rule_code:ruleCode,result:ruleCode==="V012"&&[1,2].includes(runIndex)?"review":"pass",explanation:ruleCode==="V012"?"Buyer confirmation is awaiting a decision.":`Deterministic ${ruleCode} evidence is consistent.`,evidence:{ruleId:ruleCode,version:"verification-v1",status:ruleCode==="V012"&&[1,2].includes(runIndex)?"review":"pass",severity:ruleCode==="V012"&&[1,2].includes(runIndex)?"warning":"info",title:`Rule ${ruleCode}`,explanation:`Recorded ${ruleCode} result.`,comparedValues:{source:"seeded_record"},sourceDocumentIds:[]}};}));
const { error: checksError } = await admin.from("verification_checks").upsert(checkRows);
if (checksError) throw checksError;

const { data:browserTestApplications, error:browserTestLookupError } = await admin
  .from("applications")
  .select("id")
  .like("invoice_number", "INV-E2E-%");
if (browserTestLookupError) throw browserTestLookupError;
const browserTestIds = (browserTestApplications ?? []).map((application) => application.id);
if (browserTestIds.length) {
  const { data:browserTestDocuments, error:browserTestDocumentsError } = await admin.from("documents").select("storage_path").in("application_id", browserTestIds);
  if (browserTestDocumentsError) throw browserTestDocumentsError;
  const paths = (browserTestDocuments ?? []).map((document) => document.storage_path);
  if (paths.length) {
    const { error:storageCleanupError } = await admin.storage.from("application-documents").remove(paths);
    if (storageCleanupError) throw storageCleanupError;
  }
}
const { error: cleanupError } = browserTestIds.length
  ? await admin.from("applications").delete().in("id", browserTestIds)
  : { error: null };
if (cleanupError) throw cleanupError;

console.log("PASS: fictional identities, memberships, and workflow records are provisioned.");
