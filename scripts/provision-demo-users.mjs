import { createClient } from "@supabase/supabase-js";

const url = process.env.PROOFFLOW_TEST_SUPABASE_URL;
const serviceRoleKey = process.env.PROOFFLOW_TEST_SERVICE_ROLE_KEY;
const password = process.env.PROOFFLOW_DEMO_PASSWORD;
if (!url || !serviceRoleKey || !password) throw new Error("Demo provisioning credentials are missing.");

const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
const { error: organizationsError } = await admin.from("organizations").upsert([
  { id: "11111111-1111-4111-8111-111111111111", name: "Ndlovu Office Supply Demo", slug: "ndlovu-office-supply-demo", kind: "sme", registration_number: "DEMO-SME-001", is_demo: true },
  { id: "22222222-2222-4222-8222-222222222222", name: "Ubuntu Retail Group Demo", slug: "ubuntu-retail-group-demo", kind: "buyer", registration_number: "DEMO-BUYER-001", is_demo: true },
  { id: "33333333-3333-4333-8333-333333333333", name: "ProofFlow Capital Demo", slug: "proofflow-capital-demo", kind: "funder", registration_number: "DEMO-FUNDER-001", is_demo: true },
  { id: "44444444-4444-4444-8444-444444444444", name: "Mokoena Catering Demo", slug: "mokoena-catering-demo", kind: "sme", registration_number: "DEMO-SME-002", is_demo: true },
]);
if (organizationsError) throw organizationsError;
const identities = [
  { email: "sme.demo@proofflow.example", name: "Amara Ndlovu", role: "sme", organization_id: "11111111-1111-4111-8111-111111111111" },
  { email: "buyer.demo@proofflow.example", name: "Lebo Molefe", role: "buyer", organization_id: "22222222-2222-4222-8222-222222222222" },
  { email: "funder.demo@proofflow.example", name: "Thandi Khumalo", role: "funder", organization_id: "33333333-3333-4333-8333-333333333333" },
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
  { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1", owner_organization_id: "11111111-1111-4111-8111-111111111111", buyer_organization_id: "22222222-2222-4222-8222-222222222222", created_by: usersByRole.sme, title: "Ubuntu stationery delivery Demo", status: "buyer_confirmed", currency: "ZAR", invoice_number: "INV-2039-DEMO", invoice_total_minor: 4875000, requested_amount_minor: 3900000, invoice_issued_on: "2026-08-20", invoice_due_on: "2026-10-19", submitted_at: "2026-09-04T09:00:00Z" },
  { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2", owner_organization_id: "11111111-1111-4111-8111-111111111111", buyer_organization_id: "22222222-2222-4222-8222-222222222222", created_by: usersByRole.sme, title: "Office paper order Demo", status: "buyer_pending", currency: "ZAR", invoice_number: "INV-2040-DEMO", invoice_total_minor: 2240000, requested_amount_minor: 1792000, invoice_issued_on: "2026-08-28", invoice_due_on: "2026-10-27", submitted_at: "2026-09-04T22:00:00Z" },
  { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3", owner_organization_id: "44444444-4444-4444-8444-444444444444", buyer_organization_id: "22222222-2222-4222-8222-222222222222", created_by: usersByRole.sme, title: "Catering completion Demo", status: "buyer_pending", currency: "ZAR", invoice_number: "INV-1184-DEMO", invoice_total_minor: 1875000, requested_amount_minor: 1500000, invoice_issued_on: "2026-08-25", invoice_due_on: "2026-10-24", submitted_at: "2026-09-04T07:00:00Z" },
  { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4", owner_organization_id: "44444444-4444-4444-8444-444444444444", buyer_organization_id: "22222222-2222-4222-8222-222222222222", created_by: usersByRole.sme, title: "Training catering Demo", status: "buyer_confirmed", currency: "ZAR", invoice_number: "INV-1180-DEMO", invoice_total_minor: 8230000, requested_amount_minor: 6584000, invoice_issued_on: "2026-08-10", invoice_due_on: "2026-10-09", submitted_at: "2026-09-03T10:00:00Z" },
];
const { error: applicationsError } = await admin.from("applications").upsert(applications);
if (applicationsError) throw applicationsError;

const confirmations = [
  { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1", application_id: applications[0].id, buyer_organization_id: "22222222-2222-4222-8222-222222222222", status: "confirmed", order_recognized: true, delivery_received: true, amount_recognized: true, decided_by: usersByRole.buyer, decided_at: "2026-09-05T05:48:00Z" },
  { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2", application_id: applications[1].id, buyer_organization_id: "22222222-2222-4222-8222-222222222222", status: "pending" },
  { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3", application_id: applications[2].id, buyer_organization_id: "22222222-2222-4222-8222-222222222222", status: "pending" },
  { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4", application_id: applications[3].id, buyer_organization_id: "22222222-2222-4222-8222-222222222222", status: "confirmed", order_recognized: true, delivery_received: true, amount_recognized: true, decided_by: usersByRole.buyer, decided_at: "2026-09-05T04:00:00Z" },
];
const { error: confirmationsError } = await admin.from("confirmations").upsert(confirmations);
if (confirmationsError) throw confirmationsError;

const runs = [
  { id: "cccccccc-cccc-4ccc-8ccc-ccccccccccc1", application_id: applications[0].id, initiated_by: usersByRole.sme, status: "completed", started_at: "2026-09-04T09:05:00Z", completed_at: "2026-09-04T09:06:00Z" },
  { id: "cccccccc-cccc-4ccc-8ccc-ccccccccccc2", application_id: applications[3].id, initiated_by: usersByRole.sme, status: "completed", started_at: "2026-09-03T10:05:00Z", completed_at: "2026-09-03T10:06:00Z" },
];
const { error: runsError } = await admin.from("verification_runs").upsert(runs);
if (runsError) throw runsError;
const { error: checksError } = await admin.from("verification_checks").upsert([
  { id: "dddddddd-dddd-4ddd-8ddd-ddddddddddd1", verification_run_id: runs[0].id, application_id: applications[0].id, rule_code: "DEMO_TOTAL_MATCH", result: "pass", explanation: "Demo invoice and order totals match." },
  { id: "dddddddd-dddd-4ddd-8ddd-ddddddddddd2", verification_run_id: runs[1].id, application_id: applications[3].id, rule_code: "DEMO_NAME_REVIEW", result: "review", explanation: "Demo supplier name abbreviation needs review." },
]);
if (checksError) throw checksError;

const { data:browserTestApplications, error:browserTestLookupError } = await admin
  .from("applications")
  .select("id")
  .like("invoice_number", "INV-E2E-DEMO-%");
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

console.log("PASS: hosted Demo identities, memberships, and dashboard workflow records are provisioned.");
