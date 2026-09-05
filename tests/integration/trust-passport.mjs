import { createClient } from "@supabase/supabase-js";

const url = process.env.PROOFFLOW_TEST_SUPABASE_URL;
const anonKey = process.env.PROOFFLOW_TEST_PUBLISHABLE_KEY;
const password = process.env.PROOFFLOW_TEST_PASSWORD;
if (!url || !anonKey || !password) throw new Error("Hosted Trust Passport test configuration is missing.");

const sme = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
const otherTenantApplicationId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4";
const requireNoError = (error, label) => {
  if (error) throw new Error(`${label}: ${error.message}`);
};

try {
  requireNoError(
    (await sme.auth.signInWithPassword({ email: "sme.demo@proofflow.example", password })).error,
    "SME sign-in",
  );
  const { data: membership, error: membershipError } = await sme
    .from("memberships")
    .select("organization_id")
    .eq("role", "sme")
    .single();
  requireNoError(membershipError, "SME membership");

  const { data: applications, error: applicationError } = await sme
    .from("applications")
    .select("id,owner_organization_id,invoice_total_minor,currency")
    .eq("owner_organization_id", membership.organization_id);
  requireNoError(applicationError, "tenant applications");
  if (!applications.length || applications.some((row) => row.owner_organization_id !== membership.organization_id)) {
    throw new Error("The Passport application source was not tenant-isolated.");
  }

  const { data: hiddenApplication, error: hiddenError } = await sme
    .from("applications")
    .select("id")
    .eq("id", otherTenantApplicationId);
  requireNoError(hiddenError, "other-tenant probe");
  if (hiddenApplication.length !== 0) throw new Error("Another SME tenant affected the Passport source.");

  const ids = applications.map((row) => row.id);
  const { data: confirmations, error: confirmationError } = await sme
    .from("confirmations")
    .select("id,application_id,status,decided_at")
    .in("application_id", ids)
    .in("status", ["confirmed", "disputed"]);
  requireNoError(confirmationError, "completed confirmations");
  if (
    confirmations.length !== 2 ||
    confirmations.some((row) => !row.decided_at || row.status !== "confirmed") ||
    !confirmations.some((row) => row.application_id === "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2")
  ) {
    throw new Error("The completed happy-path evidence was not reflected in the Passport source query.");
  }

  const { data: runs, error: runError } = await sme
    .from("verification_runs")
    .select("application_id,overall_result,completed_at")
    .in("application_id", ids)
    .eq("status", "completed")
    .order("completed_at", { ascending: false });
  requireNoError(runError, "verification history");
  const verifiedApplicationIds = new Set();
  let verifiedValueMinor = 0;
  for (const confirmation of confirmations) {
    if (confirmation.status !== "confirmed") continue;
    const latest = runs.find((run) => run.application_id === confirmation.application_id);
    if (!latest?.overall_result || latest.overall_result === "fail" || verifiedApplicationIds.has(confirmation.application_id)) continue;
    verifiedApplicationIds.add(confirmation.application_id);
    verifiedValueMinor += applications.find((row) => row.id === confirmation.application_id)?.invoice_total_minor ?? 0;
  }
  if (verifiedValueMinor !== 2_240_000) {
    throw new Error(`Expected a ZAR 22,400 verified total, received ${verifiedValueMinor} minor units.`);
  }

  process.stdout.write(
    "Hosted Trust Passport completed-event, happy-path update, verified-value, and tenant-isolation checks passed.\n",
  );
} finally {
  await sme.auth.signOut();
}
