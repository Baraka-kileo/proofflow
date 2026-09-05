import { createClient } from "@supabase/supabase-js";

const url = process.env.PROOFFLOW_TEST_SUPABASE_URL;
const publishableKey = process.env.PROOFFLOW_TEST_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.PROOFFLOW_TEST_SERVICE_ROLE_KEY;

if (!url || !publishableKey || !serviceRoleKey) {
  throw new Error("Hosted RLS test credentials were not supplied.");
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const run = crypto.randomUUID();
const createdUserIds = [];
const createdOrganizationIds = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function createIdentity(label, role, organizationId) {
  const email = `proof-rls-${label}-${run}@example.invalid`;
  const password = `Proof-${run}-${label}-Aa1!`;
  const { data: created, error: userError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (userError) throw userError;
  createdUserIds.push(created.user.id);

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    display_name: `${label} RLS Demo User`,
  });
  if (profileError) throw profileError;
  const { error: membershipError } = await admin.from("memberships").insert({
    organization_id: organizationId,
    profile_id: created.user.id,
    role,
  });
  if (membershipError) throw membershipError;

  const client = createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
  return { id: created.user.id, client };
}

async function createOrganization(label, kind) {
  const { data, error } = await admin
    .from("organizations")
    .insert({
      name: `${label} RLS Demo Organization`,
      slug: `rls-${label.toLowerCase()}-${run}`,
      kind,
      is_demo: true,
    })
    .select("id")
    .single();
  if (error) throw error;
  createdOrganizationIds.push(data.id);
  return data.id;
}

async function createApplication(ownerId, buyerId, creatorId, label, status) {
  const { data, error } = await admin
    .from("applications")
    .insert({
      owner_organization_id: ownerId,
      buyer_organization_id: buyerId,
      created_by: creatorId,
      title: `${label} RLS Demo Application`,
      invoice_number: `INV-${label}-${run}`,
      status,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function isVisible(client, table, id) {
  const { data, error } = await client.from(table).select("id").eq("id", id);
  if (error) throw error;
  return data.length === 1;
}

try {
  const smeAOrganization = await createOrganization("SME-A", "sme");
  const smeBOrganization = await createOrganization("SME-B", "sme");
  const buyerAOrganization = await createOrganization("Buyer-A", "buyer");
  const buyerBOrganization = await createOrganization("Buyer-B", "buyer");
  const funderOrganization = await createOrganization("Funder", "funder");

  const smeA = await createIdentity("SME-A", "sme", smeAOrganization);
  const smeB = await createIdentity("SME-B", "sme", smeBOrganization);
  const buyerA = await createIdentity("Buyer-A", "buyer", buyerAOrganization);
  const buyerB = await createIdentity("Buyer-B", "buyer", buyerBOrganization);
  const funder = await createIdentity("Funder", "funder", funderOrganization);

  const draftA = await createApplication(smeAOrganization, buyerAOrganization, smeA.id, "DRAFT-A", "draft");
  const draftB = await createApplication(smeBOrganization, buyerBOrganization, smeB.id, "DRAFT-B", "draft");
  const pendingA = await createApplication(smeAOrganization, buyerAOrganization, smeA.id, "PENDING-A", "buyer_pending");
  const pendingB = await createApplication(smeBOrganization, buyerBOrganization, smeB.id, "PENDING-B", "buyer_pending");
  const confirmedA = await createApplication(smeAOrganization, buyerAOrganization, smeA.id, "CONFIRMED-A", "buyer_confirmed");

  assert(await isVisible(smeA.client, "applications", draftA), "SME A could not read its own application.");
  assert(!(await isVisible(smeA.client, "applications", draftB)), "SME A read SME B's application by substituting its ID.");
  assert(await isVisible(smeB.client, "applications", draftB), "SME B could not read its own application.");

  const ownCreatedId = crypto.randomUUID();
  const { error: ownInsertError } = await smeA.client.from("applications").insert({
    id: ownCreatedId,
    owner_organization_id: smeAOrganization,
    buyer_organization_id: buyerAOrganization,
    created_by: smeA.id,
    title: "SME A Created RLS Demo",
    invoice_number: `INV-CREATE-A-${run}`,
  });
  assert(!ownInsertError, `SME A could not create its own draft: ${ownInsertError?.message}`);

  const { error: crossInsertError } = await smeA.client.from("applications").insert({
    owner_organization_id: smeBOrganization,
    buyer_organization_id: buyerBOrganization,
    created_by: smeA.id,
    title: "Blocked Cross Tenant RLS Demo",
    invoice_number: `INV-BLOCKED-${run}`,
  });
  assert(crossInsertError, "SME A inserted an application into SME B's tenant.");

  const { data: ownUpdate, error: ownUpdateError } = await smeA.client
    .from("applications")
    .update({ title: "SME A Updated RLS Demo" })
    .eq("id", draftA)
    .select("id");
  assert(!ownUpdateError && ownUpdate.length === 1, "SME A could not update its own draft.");
  const { data: crossUpdate, error: crossUpdateError } = await smeA.client
    .from("applications")
    .update({ title: "Cross Tenant Attack" })
    .eq("id", draftB)
    .select("id");
  assert(!crossUpdateError && crossUpdate.length === 0, "SME A updated SME B's application by substituting its ID.");

  const { data: crossDelete, error: crossDeleteError } = await smeA.client
    .from("applications")
    .delete()
    .eq("id", draftB)
    .select("id");
  assert(!crossDeleteError && crossDelete.length === 0, "SME A deleted SME B's application by substituting its ID.");
  assert(await isVisible(smeB.client, "applications", draftB), "SME B's row disappeared after the blocked delete.");
  const { data: ownDelete, error: ownDeleteError } = await smeA.client
    .from("applications")
    .delete()
    .eq("id", ownCreatedId)
    .select("id");
  assert(!ownDeleteError && ownDelete.length === 1, "SME A could not delete its own draft.");

  const documentA = crypto.randomUUID();
  const documentB = crypto.randomUUID();
  const baseDocument = (id, applicationId, ownerId, uploaderId, marker) => ({
    id,
    application_id: applicationId,
    owner_organization_id: ownerId,
    uploaded_by: uploaderId,
    kind: "invoice",
    original_filename: `${marker}.pdf`,
    storage_path: `${ownerId}/${applicationId}/${id}/${marker}.pdf`,
    mime_type: "application/pdf",
    byte_size: 20,
    sha256: marker.repeat(64).slice(0, 64),
  });
  const { error: documentsError } = await admin.from("documents").insert([
    baseDocument(documentA, draftA, smeAOrganization, smeA.id, "a"),
    baseDocument(documentB, draftB, smeBOrganization, smeB.id, "b"),
  ]);
  if (documentsError) throw documentsError;
  assert(await isVisible(smeA.client, "documents", documentA), "SME A could not read its own document.");
  assert(!(await isVisible(smeA.client, "documents", documentB)), "SME A read SME B's document.");

  const ownDocumentId = crypto.randomUUID();
  const { error: ownDocumentInsert } = await smeA.client.from("documents").insert({
    ...baseDocument(ownDocumentId, draftA, smeAOrganization, smeA.id, "c"),
    kind: "purchase_order",
  });
  assert(!ownDocumentInsert, "SME A could not create its own document record.");
  const { error: crossDocumentInsert } = await smeA.client.from("documents").insert({
    ...baseDocument(crypto.randomUUID(), draftB, smeBOrganization, smeA.id, "d"),
    kind: "purchase_order",
  });
  assert(crossDocumentInsert, "SME A inserted a document record into SME B's application.");
  const { data: crossDocumentUpdate } = await smeA.client
    .from("documents")
    .update({ original_filename: "attack.pdf" })
    .eq("id", documentB)
    .select("id");
  assert(crossDocumentUpdate.length === 0, "SME A updated SME B's document.");
  const { data: crossDocumentDelete } = await smeA.client
    .from("documents")
    .delete()
    .eq("id", documentB)
    .select("id");
  assert(crossDocumentDelete.length === 0, "SME A deleted SME B's document.");
  const { data: ownDocumentDelete } = await smeA.client
    .from("documents")
    .delete()
    .eq("id", ownDocumentId)
    .select("id");
  assert(ownDocumentDelete.length === 1, "SME A could not delete its own document record.");

  const { data: confirmations, error: confirmationCreateError } = await admin
    .from("confirmations")
    .insert([
      { application_id: pendingA, buyer_organization_id: buyerAOrganization },
      { application_id: pendingB, buyer_organization_id: buyerBOrganization },
    ])
    .select("id, application_id");
  if (confirmationCreateError) throw confirmationCreateError;
  const confirmationA = confirmations.find((item) => item.application_id === pendingA).id;
  const confirmationB = confirmations.find((item) => item.application_id === pendingB).id;
  assert(await isVisible(buyerA.client, "confirmations", confirmationA), "Buyer A could not read its addressed request.");
  assert(!(await isVisible(buyerA.client, "confirmations", confirmationB)), "Buyer A read Buyer B's request.");
  const { data: buyerCrossUpdate } = await buyerA.client
    .from("confirmations")
    .update({ status: "disputed", reason: "Cross-tenant attack", decided_by: buyerA.id, decided_at: new Date().toISOString() })
    .eq("id", confirmationB)
    .select("id");
  assert(buyerCrossUpdate.length === 0, "Buyer A decided Buyer B's confirmation.");
  const { data: buyerOwnUpdate, error: buyerOwnError } = await buyerA.client
    .from("confirmations")
    .update({
      status: "confirmed",
      order_recognized: true,
      delivery_received: true,
      amount_recognized: true,
      decided_by: buyerA.id,
      decided_at: new Date().toISOString(),
    })
    .eq("id", confirmationA)
    .select("id");
  assert(!buyerOwnError && buyerOwnUpdate.length === 1, "Buyer A could not decide its own confirmation.");
  assert(await isVisible(buyerB.client, "applications", pendingB), "Buyer B could not read its addressed application.");
  assert(!(await isVisible(buyerA.client, "applications", pendingB)), "Buyer A read Buyer B's addressed application.");

  assert(await isVisible(funder.client, "applications", confirmedA), "Funder could not read a buyer-confirmed package.");
  assert(!(await isVisible(funder.client, "applications", draftA)), "Funder read an SME draft.");
  assert(!(await isVisible(funder.client, "applications", pendingA)), "Funder read a buyer-pending package.");

  const { data: verificationRun, error: runError } = await admin
    .from("verification_runs")
    .insert({ application_id: confirmedA, initiated_by: smeA.id, status: "completed" })
    .select("id")
    .single();
  if (runError) throw runError;
  const { data: verificationCheck, error: checkError } = await admin
    .from("verification_checks")
    .insert({
      verification_run_id: verificationRun.id,
      application_id: confirmedA,
      rule_code: "RLS_DEMO_CHECK",
      result: "pass",
      explanation: "Synthetic immutable RLS demonstration check.",
    })
    .select("id")
    .single();
  if (checkError) throw checkError;
  assert(await isVisible(funder.client, "verification_checks", verificationCheck.id), "Funder could not read an eligible check.");
  const { data: rewriteCheckRows, error: rewriteCheckError } = await funder.client
    .from("verification_checks")
    .update({ result: "fail" })
    .eq("id", verificationCheck.id)
    .select("id");
  assert(!rewriteCheckError && rewriteCheckRows.length === 0, "Ordinary client rewrote an immutable verification fact.");
  const { data: unchangedCheck } = await admin
    .from("verification_checks")
    .select("result")
    .eq("id", verificationCheck.id)
    .single();
  assert(unchangedCheck.result === "pass", "The hidden verification update changed the stored fact.");
  const { data: deletedCheckRows, error: deleteCheckError } = await funder.client
    .from("verification_checks")
    .delete()
    .eq("id", verificationCheck.id)
    .select("id");
  assert(!deleteCheckError && deletedCheckRows.length === 0, "Ordinary client deleted an immutable verification fact.");
  const { error: insertAuditError } = await smeA.client.from("audit_events").insert({
    organization_id: smeAOrganization,
    application_id: confirmedA,
    actor_profile_id: smeA.id,
    action: "rls.attack",
    resource_type: "application",
    resource_id: confirmedA,
  });
  assert(insertAuditError, "Ordinary client fabricated an audit event.");

  console.log("PASS: two-tenant select, insert, update, delete, buyer, funder, and immutable-fact RLS checks passed.");
} finally {
  if (createdOrganizationIds.length) {
    await admin.from("applications").delete().in("owner_organization_id", createdOrganizationIds);
    await admin.from("organizations").delete().in("id", createdOrganizationIds);
  }
  for (const userId of createdUserIds) await admin.auth.admin.deleteUser(userId);
}
