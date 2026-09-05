import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { SessionUser } from "@/types/domain";

type Metric = { label: string; value: string; note: string };
type BuyerHistory = { id: string; supplier: string; invoice: string; amount: string; status: "confirmed" | "disputed"; decided: string; href: string };
type FunderOffer = { id: string; supplier: string; buyer: string; invoice: string; net: string; status: string; kind: "offer" | "decline"; href: string; created: string };
type SmeApplication = { id: string; href: string; buyer: string; amount: string; status: string; invoice: string };

export type DashboardData =
  | { role: "sme"; metrics: Metric[]; application: ({ progress: number; next: string } & SmeApplication) | null; applications: SmeApplication[] }
  | { role: "buyer"; metrics: Metric[]; requests: { id: string; reference: string; href: string; supplier: string; invoice: string; amount: string; age: string; warnings: number }[]; history: BuyerHistory[] }
  | { role: "funder"; metrics: Metric[]; applications: { id: string; href: string; supplier: string; buyer: string; amount: string; dueDate: string; confirmed: string; warnings: number; certificateHref: string | null }[]; offers: FunderOffer[] };

const money = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium", timeZone: "Africa/Johannesburg" });
const statuses: Record<string, { label: string; progress: number; next: string }> = {
  draft: { label: "Draft", progress: 10, next: "Add the application details" },
  documents_uploaded: { label: "Documents uploaded", progress: 30, next: "Extract the document fields" },
  fields_extracted: { label: "Fields extracted", progress: 45, next: "Review the extracted fields" },
  sme_reviewed: { label: "Evidence reviewed", progress: 55, next: "Run the verification checks" },
  checks_complete: { label: "Checks complete", progress: 65, next: "Request buyer confirmation" },
  buyer_pending: { label: "Buyer confirmation pending", progress: 70, next: "Waiting for buyer confirmation" },
  buyer_confirmed: { label: "Buyer confirmed", progress: 75, next: "Waiting for funder review" },
  buyer_disputed: { label: "Buyer disputed", progress: 65, next: "Review the buyer's reason" },
  funder_review: { label: "Funder review", progress: 82, next: "Waiting for the funder's decision" },
  offer_made: { label: "Offer ready", progress: 90, next: "Review the simulated offer" },
  offer_accepted: { label: "Offer accepted", progress: 96, next: "Complete simulated funding" },
  offer_declined: { label: "Offer declined", progress: 100, next: "Application closed" },
  funded_simulated: { label: "Simulated funded", progress: 100, next: "View the Trust Passport" },
};

function formatMoney(minor: number | null) { return money.format((minor ?? 0) / 100); }
function formatDate(value: string | null) { return value ? dateTime.format(new Date(value.includes("T") ? value : `${value}T12:00:00+02:00`)) : "Date unavailable"; }
function shortId(prefix: string, id: string) { return `${prefix}-${id.slice(-4).toUpperCase()}`; }
function elapsed(iso: string | null) {
  if (!iso) return "recently";
  const hours = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000));
  if (hours < 1) return "under 1 hour";
  return `${hours} ${hours === 1 ? "hour" : "hours"}`;
}
function assertQuery(error: { message: string } | null, context: string) {
  if (error) throw new Error(`Unable to load ${context}. Please try again.`);
}

export async function getDashboard(session: SessionUser): Promise<DashboardData> {
  const supabase = await createClient();
  if (session.role === "sme") {
    const { data, error } = await supabase
      .from("applications")
      .select("id,status,invoice_number,invoice_total_minor,submitted_at,buyer:organizations!applications_buyer_organization_id_fkey(name)")
      .eq("owner_organization_id", session.organizationId)
      .order("submitted_at", { ascending: false, nullsFirst: false });
    assertQuery(error, "your applications");
    const rows = data ?? [];
    const current = rows[0];
    const confirmed = rows.filter((row) => ["buyer_confirmed", "funder_review", "offer_made", "offer_accepted", "funded_simulated"].includes(row.status));
    const state = current ? statuses[current.status] : null;
    const applications = rows.map((row) => ({ id: shortId("PF", row.id), href: `/applications/${row.id}`, buyer: row.buyer.name, amount: formatMoney(row.invoice_total_minor), status: statuses[row.status]?.label ?? row.status, invoice: row.invoice_number ?? "Invoice not set" }));
    return {
      role: "sme",
      metrics: [
        { label: "Evidence completion", value: current ? `${state?.progress ?? 0}%` : "0%", note: current ? state?.next ?? "Continue the evidence journey" : "Start the first application" },
        { label: "Verified value", value: formatMoney(confirmed.reduce((sum, row) => sum + (row.invoice_total_minor ?? 0), 0)), note: `Across ${confirmed.length} buyer-confirmed ${confirmed.length === 1 ? "invoice" : "invoices"}` },
        { label: "Buyer confirmations", value: String(confirmed.length), note: "RLS-filtered to your organization" },
      ],
      application: current && state ? { ...applications[0], progress: state.progress, next: state.next } : null,
      applications,
    };
  }

  if (session.role === "buyer") {
    const { data, error } = await supabase
      .from("confirmations")
      .select("id,requested_at,decided_at,status,application:applications!confirmations_application_id_fkey(id,invoice_number,invoice_total_minor,owner:organizations!applications_owner_organization_id_fkey(name))")
      .eq("buyer_organization_id", session.organizationId)
      .order("requested_at", { ascending: false });
    assertQuery(error, "buyer confirmations");
    const allRows = data ?? [];
    const rows = allRows.filter((row) => row.status === "pending").reverse();
    const applicationIds = rows.map((row) => row.application.id);
    const { data: verificationRows, error: warningError } = applicationIds.length
      ? await supabase.from("verification_runs").select("id,application_id,completed_at,verification_checks(result)").in("application_id", applicationIds).eq("status", "completed").order("completed_at", { ascending: false })
      : { data: [], error: null };
    assertQuery(warningError, "buyer verification warnings");
    const requests = rows.map((row) => {
      const latest = (verificationRows ?? []).find((run) => run.application_id === row.application.id);
      return { id: row.id, reference: shortId("CF", row.id), href: `/confirmations/${row.id}`, supplier: row.application.owner.name, invoice: row.application.invoice_number ?? "Invoice pending", amount: formatMoney(row.application.invoice_total_minor), age: elapsed(row.requested_at), warnings: (latest?.verification_checks ?? []).filter((check) => check.result !== "pass").length };
    });
    const history: BuyerHistory[] = allRows.flatMap((row) => row.decided_at && (row.status === "confirmed" || row.status === "disputed") ? [{ id: row.id, supplier: row.application.owner.name, invoice: row.application.invoice_number ?? "Invoice unavailable", amount: formatMoney(row.application.invoice_total_minor), status: row.status, decided: formatDate(row.decided_at), href: `/confirmations/${row.id}` }] : []);
    return {
      role: "buyer",
      metrics: [
        { label: "Needs your action", value: String(rows.length), note: rows[0] ? `Oldest waiting ${elapsed(rows[0].requested_at)}` : "Queue is clear" },
        { label: "Visible invoice value", value: formatMoney(rows.reduce((sum, row) => sum + (row.application.invoice_total_minor ?? 0), 0)), note: "Pending requests addressed to you" },
        { label: "Completed decisions", value: String(history.length), note: "Immutable confirmation history" },
      ],
      requests,
      history,
    };
  }

  const [{ data, error }, { data: offerRows, error: offerError }] = await Promise.all([
    supabase.from("applications").select("id,invoice_total_minor,invoice_due_on,owner:organizations!applications_owner_organization_id_fkey(name),buyer:organizations!applications_buyer_organization_id_fkey(name)").in("status", ["buyer_confirmed", "funder_review"]),
    supabase.from("offers").select("id,status,decision_kind,net_advance_minor,created_at,application:applications!offers_application_id_fkey(invoice_number,owner:organizations!applications_owner_organization_id_fkey(name),buyer:organizations!applications_buyer_organization_id_fkey(name))").order("created_at", { ascending: false }).limit(10),
  ]);
  assertQuery(error, "funder review queue");
  assertQuery(offerError, "funder decision history");
  const rows = data ?? [];
  const ids = rows.map((row) => row.id);
  const [{ data: checks, error: checksError }, { data: confirmations, error: confirmationsError }] = ids.length
    ? await Promise.all([
        supabase.from("verification_runs").select("id,application_id,completed_at,verification_checks(result)").in("application_id", ids).eq("status", "completed").order("completed_at", { ascending: false }),
        supabase.from("confirmations").select("id,application_id,decided_at,approval_id").in("application_id", ids).eq("status", "confirmed"),
      ])
    : [{ data: [], error: null }, { data: [], error: null }];
  assertQuery(checksError, "verification summaries");
  assertQuery(confirmationsError, "confirmation summaries");
  const applications = rows.map((row) => {
    const confirmation = confirmations?.find((item) => item.application_id === row.id);
    const latestRun = (checks ?? []).find((item) => item.application_id === row.id);
    return { id: shortId("PF", row.id), href: `/applications/${row.id}`, supplier: row.owner.name, buyer: row.buyer.name, amount: formatMoney(row.invoice_total_minor), dueDate: formatDate(row.invoice_due_on), confirmed: elapsed(confirmation?.decided_at ?? null), warnings: (latestRun?.verification_checks ?? []).filter((item) => item.result !== "pass").length, certificateHref: confirmation?.approval_id ? `/confirmations/${confirmation.id}/certificate` : null };
  });
  const offers: FunderOffer[] = (offerRows ?? []).map((offer) => ({ id: offer.id, supplier: offer.application.owner.name, buyer: offer.application.buyer.name, invoice: offer.application.invoice_number ?? "Invoice unavailable", net: formatMoney(offer.net_advance_minor), status: offer.status.replaceAll("_", " "), kind: offer.decision_kind === "decline" ? "decline" : "offer", href: `/offers/${offer.id}`, created: formatDate(offer.created_at) }));
  return {
    role: "funder",
    metrics: [
      { label: "Ready for review", value: String(rows.length), note: "All buyer confirmed" },
      { label: "Requested value", value: formatMoney(rows.reduce((sum, row) => sum + (row.invoice_total_minor ?? 0), 0)), note: "Across your current queue" },
      { label: "Recorded decisions", value: String(offers.length), note: "Simulated offers and declines" },
    ],
    applications,
    offers,
  };
}
