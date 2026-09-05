import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  calculateTrustPassportMetrics,
  type PassportEvidenceInput,
  type TrustPassportMetrics,
} from "@/lib/trust-passport/metrics";
import type { SessionUser } from "@/types/domain";

export async function getTrustPassport(session: SessionUser): Promise<TrustPassportMetrics> {
  const supabase = await createClient();
  const { data: applications, error: applicationError } = await supabase
    .from("applications")
    .select(
      "id,buyer_organization_id,invoice_number,invoice_total_minor,currency,buyer:organizations!applications_buyer_organization_id_fkey(name)",
    )
    .eq("owner_organization_id", session.organizationId);

  if (applicationError) throw new Error("Unable to load the Trust Passport evidence.");
  if (!applications?.length) return calculateTrustPassportMetrics([]);

  const applicationIds = applications.map((application) => application.id);
  const [{ data: confirmations, error: confirmationError }, { data: runs, error: runError }] =
    await Promise.all([
      supabase
        .from("confirmations")
        .select("id,application_id,buyer_organization_id,status,decided_at")
        .in("application_id", applicationIds)
        .in("status", ["confirmed", "disputed"]),
      supabase
        .from("verification_runs")
        .select("application_id,overall_result,completed_at")
        .in("application_id", applicationIds)
        .eq("status", "completed")
        .order("completed_at", { ascending: false }),
    ]);

  if (confirmationError || runError) throw new Error("Unable to load the Trust Passport history.");

  const evidence: PassportEvidenceInput[] = (confirmations ?? []).flatMap((confirmation) => {
    if (!confirmation.decided_at || (confirmation.status !== "confirmed" && confirmation.status !== "disputed")) {
      return [];
    }
    const application = applications.find((item) => item.id === confirmation.application_id);
    if (!application) return [];
    const latestRun = (runs ?? []).find((run) => run.application_id === application.id);
    return [
      {
        applicationId: application.id,
        confirmationId: confirmation.id,
        confirmationStatus: confirmation.status,
        decidedAt: confirmation.decided_at,
        buyerOrganizationId: confirmation.buyer_organization_id,
        buyerName: application.buyer.name,
        invoiceNumber: application.invoice_number,
        invoiceTotalMinor: application.invoice_total_minor,
        currency: application.currency,
        verificationResult: latestRun?.overall_result ?? null,
      },
    ];
  });

  return calculateTrustPassportMetrics(evidence);
}
