import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type { SessionUser } from "@/types/domain";

type Metric = { label: string; value: string; note: string };
type BuyerHistory = {
  id: string;
  supplier: string;
  invoice: string;
  amount: string;
  status: "confirmed" | "disputed";
  decided: string;
  href: string;
};
type FunderOffer = {
  id: string;
  supplier: string;
  buyer: string;
  invoice: string;
  net: string;
  status: string;
  kind: "offer" | "decline";
  href: string;
  created: string;
};
type SmeApplication = {
  id: string;
  href: string;
  buyer: string;
  amount: string;
  status: string;
  invoice: string;
};

export type DashboardData =
  | {
      role: "sme";
      metrics: Metric[];
      application: ({ progress: number; next: string } & SmeApplication) | null;
      applications: SmeApplication[];
    }
  | {
      role: "buyer";
      metrics: Metric[];
      requests: {
        id: string;
        reference: string;
        href: string;
        supplier: string;
        invoice: string;
        amount: string;
        age: string;
        warnings: number;
        kind: "confirmation" | "system_exception";
      }[];
      history: BuyerHistory[];
    }
  | {
      role: "funder";
      metrics: Metric[];
      applications: {
        id: string;
        href: string;
        supplier: string;
        buyer: string;
        amount: string;
        dueDate: string;
        confirmed: string;
        warnings: number;
        certificateHref: string | null;
        buyerEvidence: "human" | "system";
      }[];
      offers: FunderOffer[];
    };

const money = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 0,
});
const dateTime = new Intl.DateTimeFormat("en-ZA", {
  dateStyle: "medium",
  timeZone: "Africa/Johannesburg",
});
const statuses: Record<
  string,
  { label: string; progress: number; next: string }
> = {
  draft: { label: "Draft", progress: 10, next: "Add the application details" },
  documents_uploaded: {
    label: "Documents uploaded",
    progress: 30,
    next: "Enter the evidence details",
  },
  fields_extracted: {
    label: "Evidence entered",
    progress: 45,
    next: "Review the entered evidence",
  },
  sme_reviewed: {
    label: "Evidence reviewed",
    progress: 55,
    next: "Run the verification checks",
  },
  checks_complete: {
    label: "Checks complete",
    progress: 65,
    next: "Verify with the large customer",
  },
  buyer_system_checking: {
    label: "Checking customer records",
    progress: 68,
    next: "Waiting for customer verification",
  },
  buyer_system_verified: {
    label: "Customer records verified",
    progress: 75,
    next: "Waiting for funder review",
  },
  buyer_exception_review: {
    label: "Large customer review required",
    progress: 70,
    next: "Waiting for the large customer to resolve a difference",
  },
  buyer_system_blocked: {
    label: "Cannot proceed",
    progress: 65,
    next: "Review the automated result",
  },
  buyer_pending: {
    label: "Customer confirmation pending",
    progress: 70,
    next: "Waiting for customer confirmation",
  },
  buyer_confirmed: {
    label: "Large customer confirmed",
    progress: 75,
    next: "Waiting for funder review",
  },
  buyer_disputed: {
    label: "Large customer disputed",
    progress: 65,
    next: "Review the customer's reason",
  },
  funder_review: {
    label: "Funder review",
    progress: 82,
    next: "Waiting for the funder's decision",
  },
  offer_made: {
    label: "Offer ready",
    progress: 90,
    next: "Review the funding proposal",
  },
  offer_accepted: {
    label: "Offer accepted",
    progress: 96,
    next: "Await funding partner confirmation",
  },
  offer_declined: {
    label: "Offer declined",
    progress: 100,
    next: "Application closed",
  },
  funded_simulated: {
    label: "Funding confirmed",
    progress: 100,
    next: "View the Trust Passport",
  },
};

function formatMoney(minor: number | null) {
  return money.format((minor ?? 0) / 100);
}
function formatDate(value: string | null) {
  return value
    ? dateTime.format(
        new Date(value.includes("T") ? value : `${value}T12:00:00+02:00`),
      )
    : "Date unavailable";
}
function shortId(prefix: string, id: string) {
  return `${prefix}-${id.slice(-4).toUpperCase()}`;
}
function elapsed(iso: string | null) {
  if (!iso) return "recently";
  const hours = Math.max(
    0,
    Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000),
  );
  if (hours < 1) return "under 1 hour";
  return `${hours} ${hours === 1 ? "hour" : "hours"}`;
}
function assertQuery(error: { message: string } | null, context: string) {
  if (error) throw new Error(`Unable to load ${context}. Please try again.`);
}

export async function getDashboard(
  session: SessionUser,
): Promise<DashboardData> {
  const supabase = await createClient();
  if (session.role === "sme") {
    const { data, error } = await supabase
      .from("applications")
      .select(
        "id,status,invoice_number,invoice_total_minor,submitted_at,buyer:organizations!applications_buyer_organization_id_fkey(name)",
      )
      .eq("owner_organization_id", session.organizationId)
      .order("submitted_at", { ascending: false, nullsFirst: false });
    assertQuery(error, "your applications");
    const rows = data ?? [];
    const current = rows[0];
    const confirmed = rows.filter((row) =>
      [
        "buyer_confirmed",
        "buyer_system_verified",
        "funder_review",
        "offer_made",
        "offer_accepted",
        "funded_simulated",
      ].includes(row.status),
    );
    const state = current ? statuses[current.status] : null;
    const applications = rows.map((row) => ({
      id: shortId("PF", row.id),
      href: `/applications/${row.id}`,
      buyer: row.buyer.name,
      amount: formatMoney(row.invoice_total_minor),
      status: statuses[row.status]?.label ?? row.status,
      invoice: row.invoice_number ?? "Invoice not set",
    }));
    return {
      role: "sme",
      metrics: [
        {
          label: "Evidence completion",
          value: current ? `${state?.progress ?? 0}%` : "0%",
          note: current
            ? (state?.next ?? "Continue the evidence journey")
            : "Start the first application",
        },
        {
          label: "Verified value",
          value: formatMoney(
            confirmed.reduce(
              (sum, row) => sum + (row.invoice_total_minor ?? 0),
              0,
            ),
          ),
          note: `Across ${confirmed.length} customer-verified ${confirmed.length === 1 ? "invoice" : "invoices"}`,
        },
        {
          label: "Customer evidence",
          value: String(confirmed.length),
          note: "Human confirmations and automated checks",
        },
      ],
      application:
        current && state
          ? { ...applications[0], progress: state.progress, next: state.next }
          : null,
      applications,
    };
  }

  if (session.role === "buyer") {
    const { data, error } = await supabase
      .from("confirmations")
      .select(
        "id,requested_at,decided_at,status,application:applications!confirmations_application_id_fkey(id,invoice_number,invoice_total_minor,owner:organizations!applications_owner_organization_id_fkey(name))",
      )
      .eq("buyer_organization_id", session.organizationId)
      .order("requested_at", { ascending: false });
    assertQuery(error, "buyer confirmations");
    const allRows = data ?? [];
    const rows = allRows.filter((row) => row.status === "pending").reverse();
    const applicationIds = rows.map((row) => row.application.id);
    const { data: verificationRows, error: warningError } =
      applicationIds.length
        ? await supabase
            .from("verification_runs")
            .select(
              "id,application_id,completed_at,verification_checks(result)",
            )
            .in("application_id", applicationIds)
            .eq("status", "completed")
            .order("completed_at", { ascending: false })
        : { data: [], error: null };
    assertQuery(warningError, "buyer verification warnings");
    const requests: Extract<DashboardData, { role: "buyer" }>["requests"] =
      rows.map((row) => {
        const latest = (verificationRows ?? []).find(
          (run) => run.application_id === row.application.id,
        );
        return {
          id: row.id,
          reference: shortId("CF", row.id),
          href: `/confirmations/${row.id}`,
          supplier: row.application.owner.name,
          invoice: row.application.invoice_number ?? "Invoice pending",
          amount: formatMoney(row.application.invoice_total_minor),
          age: elapsed(row.requested_at),
          warnings: (latest?.verification_checks ?? []).filter(
            (check) => check.result !== "pass",
          ).length,
          kind: "confirmation" as const,
        };
      });
    const { data: exceptionApps, error: exceptionError } = await supabase
      .from("applications")
      .select(
        "id,invoice_number,invoice_total_minor,submitted_at,owner:organizations!applications_owner_organization_id_fkey(name)",
      )
      .eq("buyer_organization_id", session.organizationId)
      .eq("status", "buyer_exception_review");
    assertQuery(exceptionError, "buyer-system exceptions");
    const untyped = supabase as unknown as SupabaseClient;
    const exceptionRequests = await Promise.all(
      (exceptionApps ?? []).map(async (app) => {
        const { data: checks } = await untyped
          .from("integration_checks")
          .select("result")
          .eq("application_id", app.id)
          .neq("result", "pass");
        return {
          id: app.id,
          reference: shortId("PF", app.id),
          href: `/applications/${app.id}/system-evidence`,
          supplier: app.owner.name,
          invoice: app.invoice_number ?? "Invoice pending",
          amount: formatMoney(app.invoice_total_minor),
          age: elapsed(app.submitted_at),
          warnings: Array.isArray(checks) ? checks.length : 1,
          kind: "system_exception" as const,
        };
      }),
    );
    requests.push(...exceptionRequests);
    const history: BuyerHistory[] = allRows.flatMap((row) =>
      row.decided_at &&
      (row.status === "confirmed" || row.status === "disputed")
        ? [
            {
              id: row.id,
              supplier: row.application.owner.name,
              invoice: row.application.invoice_number ?? "Invoice unavailable",
              amount: formatMoney(row.application.invoice_total_minor),
              status: row.status,
              decided: formatDate(row.decided_at),
              href: `/confirmations/${row.id}`,
            },
          ]
        : [],
    );
    return {
      role: "buyer",
      metrics: [
        {
          label: "Needs your action",
          value: String(requests.length),
          note: requests.length
            ? "Confirmations and system differences"
            : "Queue is clear",
        },
        {
          label: "Visible invoice value",
          value: formatMoney(
            rows.reduce(
              (sum, row) => sum + (row.application.invoice_total_minor ?? 0),
              0,
            ) +
              (exceptionApps ?? []).reduce(
                (sum, row) => sum + (row.invoice_total_minor ?? 0),
                0,
              ),
          ),
          note: "Requests addressed to you",
        },
        {
          label: "Completed decisions",
          value: String(history.length),
          note: "Immutable confirmation history",
        },
      ],
      requests,
      history,
    };
  }

  const [{ data, error }, { data: offerRows, error: offerError }] =
    await Promise.all([
      supabase
        .from("applications")
        .select(
          "id,invoice_total_minor,invoice_due_on,owner:organizations!applications_owner_organization_id_fkey(name),buyer:organizations!applications_buyer_organization_id_fkey(name)",
        )
        .in("status", [
          "buyer_confirmed",
          "buyer_system_verified",
          "funder_review",
        ]),
      supabase
        .from("offers")
        .select(
          "id,status,decision_kind,net_advance_minor,created_at,application:applications!offers_application_id_fkey(invoice_number,owner:organizations!applications_owner_organization_id_fkey(name),buyer:organizations!applications_buyer_organization_id_fkey(name))",
        )
        .order("created_at", { ascending: false })
        .limit(10),
    ]);
  assertQuery(error, "funder review queue");
  assertQuery(offerError, "funder decision history");
  const rows = data ?? [];
  const ids = rows.map((row) => row.id);
  const [
    { data: checks, error: checksError },
    { data: confirmations, error: confirmationsError },
  ] = ids.length
    ? await Promise.all([
        supabase
          .from("verification_runs")
          .select("id,application_id,completed_at,verification_checks(result)")
          .in("application_id", ids)
          .eq("status", "completed")
          .order("completed_at", { ascending: false }),
        supabase
          .from("confirmations")
          .select("id,application_id,decided_at,approval_id")
          .in("application_id", ids)
          .eq("status", "confirmed"),
      ])
    : [
        { data: [], error: null },
        { data: [], error: null },
      ];
  assertQuery(checksError, "verification summaries");
  assertQuery(confirmationsError, "confirmation summaries");
  const untyped = supabase as unknown as SupabaseClient;
  const { data: systemRuns } = ids.length
    ? await untyped
        .from("integration_sync_runs")
        .select("application_id,completed_at,outcome")
        .in("application_id", ids)
        .eq("outcome", "system_verified")
        .order("completed_at", { ascending: false })
    : { data: [] };
  const applications = rows.map((row) => {
    const confirmation = confirmations?.find(
      (item) => item.application_id === row.id,
    );
    const systemRun = Array.isArray(systemRuns)
      ? systemRuns.find((item) => item.application_id === row.id)
      : null;
    const latestRun = (checks ?? []).find(
      (item) => item.application_id === row.id,
    );
    return {
      id: shortId("PF", row.id),
      href: `/applications/${row.id}`,
      supplier: row.owner.name,
      buyer: row.buyer.name,
      amount: formatMoney(row.invoice_total_minor),
      dueDate: formatDate(row.invoice_due_on),
      confirmed: elapsed(
        confirmation?.decided_at ?? systemRun?.completed_at ?? null,
      ),
      warnings: systemRun
        ? 0
        : (latestRun?.verification_checks ?? []).filter(
            (item) => item.result !== "pass",
          ).length,
      certificateHref: confirmation?.approval_id
        ? `/confirmations/${confirmation.id}/certificate`
        : systemRun
          ? `/applications/${row.id}/system-certificate`
          : null,
      buyerEvidence: systemRun ? ("system" as const) : ("human" as const),
    };
  });
  const offers: FunderOffer[] = (offerRows ?? []).map((offer) => ({
    id: offer.id,
    supplier: offer.application.owner.name,
    buyer: offer.application.buyer.name,
    invoice: offer.application.invoice_number ?? "Invoice unavailable",
    net: formatMoney(offer.net_advance_minor),
    status: offer.status.replaceAll("_", " "),
    kind: offer.decision_kind === "decline" ? "decline" : "offer",
    href: `/offers/${offer.id}`,
    created: formatDate(offer.created_at),
  }));
  return {
    role: "funder",
    metrics: [
      {
        label: "Ready for review",
        value: String(rows.length),
        note: "Customer evidence complete",
      },
      {
        label: "Requested value",
        value: formatMoney(
          rows.reduce((sum, row) => sum + (row.invoice_total_minor ?? 0), 0),
        ),
        note: "Across your current queue",
      },
      {
        label: "Recorded decisions",
        value: String(offers.length),
        note: "Funding proposals and declines",
      },
    ],
    applications,
    offers,
  };
}
