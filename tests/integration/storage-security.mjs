import { createClient } from "@supabase/supabase-js";

const url = process.env.PROOFFLOW_TEST_SUPABASE_URL;
const publishableKey = process.env.PROOFFLOW_TEST_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.PROOFFLOW_TEST_SERVICE_ROLE_KEY;

if (!url || !publishableKey || !serviceRoleKey) {
  throw new Error("Hosted storage test credentials were not supplied.");
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const run = crypto.randomUUID();
const email = `proof-storage-${run}@example.invalid`;
const password = `Proof-${run}-Aa1!`;
let userId;
let organizationId;
let applicationId;
let path;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function removeStaleStorageProbes() {
  const { data: organizations } = await admin
    .from("organizations")
    .select("id")
    .eq("name", "Storage Security Demo SME");

  for (const organization of organizations ?? []) {
    const { data: memberships } = await admin
      .from("memberships")
      .select("profile_id")
      .eq("organization_id", organization.id);
    await admin.from("applications").delete().eq("owner_organization_id", organization.id);
    await admin.from("organizations").delete().eq("id", organization.id);
    for (const membership of memberships ?? []) {
      await admin.auth.admin.deleteUser(membership.profile_id);
    }
  }
}

try {
  await removeStaleStorageProbes();
  const { data: created, error: userError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (userError) throw userError;
  userId = created.user.id;

  const { data: organization, error: organizationError } = await admin
    .from("organizations")
    .insert({ name: "Storage Security Demo SME", slug: `storage-${run}`, kind: "sme", is_demo: true })
    .select("id")
    .single();
  if (organizationError) throw organizationError;
  organizationId = organization.id;

  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    display_name: "Storage Security Demo User",
  });
  if (profileError) throw profileError;

  const { error: membershipError } = await admin.from("memberships").insert({
    organization_id: organizationId,
    profile_id: userId,
    role: "sme",
  });
  if (membershipError) throw membershipError;

  const { data: application, error: applicationError } = await admin
    .from("applications")
    .insert({
      owner_organization_id: organizationId,
      buyer_organization_id: organizationId,
      created_by: userId,
      title: "Storage Security Demo Application",
    })
    .select("id")
    .single();
  if (applicationError) throw applicationError;
  applicationId = application.id;

  const documentId = crypto.randomUUID();
  path = `${organizationId}/${application.id}/${documentId}/demo-proof.pdf`;
  const { error: documentError } = await admin.from("documents").insert({
    id: documentId,
    application_id: application.id,
    owner_organization_id: organizationId,
    uploaded_by: userId,
    kind: "invoice",
    original_filename: "demo-proof.pdf",
    storage_path: path,
    mime_type: "application/pdf",
    byte_size: 20,
    sha256: "a".repeat(64),
  });
  if (documentError) throw documentError;

  const member = createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: signInError } = await member.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;

  const pdf = new TextEncoder().encode("%PDF-1.4\n% Demo only\n");
  const { error: uploadError } = await member.storage
    .from("application-documents")
    .upload(path, pdf, { contentType: "application/pdf" });
  if (uploadError) throw uploadError;

  const publicUrl = member.storage.from("application-documents").getPublicUrl(path).data.publicUrl;
  const publicResponse = await fetch(publicUrl);
  assert(!publicResponse.ok, "Private object unexpectedly loaded through a public URL.");

  const { data: signed, error: signedError } = await member.storage
    .from("application-documents")
    .createSignedUrl(path, 1);
  if (signedError) throw signedError;
  assert((await fetch(signed.signedUrl)).ok, "Authorized signed preview did not load.");
  await new Promise((resolve) => setTimeout(resolve, 2200));
  assert(!(await fetch(signed.signedUrl)).ok, "Expired signed preview still loaded.");

  const malformed = `${organizationId}/${application.id}/too-short.pdf`;
  const { error: malformedError } = await member.storage
    .from("application-documents")
    .upload(malformed, pdf, { contentType: "application/pdf" });
  assert(malformedError, "Malformed storage path was accepted.");

  const { error: mimeError } = await member.storage
    .from("application-documents")
    .upload(path, pdf, { contentType: "text/plain", upsert: true });
  assert(mimeError, "Disallowed MIME type was accepted.");

  const oversized = new Uint8Array(10 * 1024 * 1024 + 1);
  const { error: sizeError } = await member.storage
    .from("application-documents")
    .upload(path, oversized, { contentType: "application/pdf", upsert: true });
  assert(sizeError, "Oversized document was accepted.");

  console.log("PASS: private URL, expiring signed preview, path, MIME, and 10 MiB limits verified.");
} finally {
  if (path) await admin.storage.from("application-documents").remove([path]);
  if (applicationId) await admin.from("applications").delete().eq("id", applicationId);
  if (organizationId) await admin.from("organizations").delete().eq("id", organizationId);
  if (userId) await admin.auth.admin.deleteUser(userId);
}
