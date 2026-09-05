import type { Metadata } from "next";
import type { SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { StatusBadge } from "@/components/status-badge";
import { ApplicationTaskLayout } from "@/features/applications/application-task-layout";
import { ApplicationDetailsReceipt } from "@/features/applications/application-details-receipt";
import { DocumentUploadPanel } from "@/features/applications/document-upload-panel";
import {
  EvidenceEntryWorkspace,
  type ReviewDocument,
} from "@/features/applications/evidence-entry-workspace";
import { ReviewReadyPanel } from "@/features/applications/review-ready-panel";
import { VerificationPanel } from "@/features/applications/verification-panel";
import { ApplicationActivity } from "@/features/applications/application-activity";
import {
  BuyerSystemEvidence,
  type BuyerSystemCheckView,
} from "@/features/integrations/buyer-system-evidence";
import { Alert } from "@/components/ui/alert";
import { FunderApplicationReview } from "@/features/offers/funder-application-review";
import { ExternalCompliancePanel } from "@/features/offers/external-compliance-panel";
import { requireApplicationAccess } from "@/lib/auth/dal";
import { deriveApplicationProgress } from "@/lib/applications/progress";
import { createClient } from "@/lib/supabase/server";
import type {
  VerificationCheck,
  VerificationStatus,
} from "@/lib/verification/rules-v1";

export const metadata: Metadata = { title: "Application" };

export default async function ApplicationPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { application, session } = await requireApplicationAccess(
    (await params).applicationId,
  );
  const supabase = await createClient();
  const integrationDb = supabase as unknown as SupabaseClient;
  const [
    { data: documents, error: documentsError },
    { data: buyer, error: buyerError },
    { data: owner, error: ownerError },
    { data: verificationRuns, error: verificationError },
    { data: auditEvents, error: auditError },
    { data: confirmation, error: confirmationError },
    { data: offer, error: offerError },
  ] = await Promise.all([
    supabase
      .from("documents")
      .select(
        "id,kind,original_filename,storage_path,byte_size,page_count,upload_completed_at,extraction_status,document_fields(id,field_name,normalized_value)",
      )
      .eq("application_id", application.id),
    supabase
      .from("organizations")
      .select("name")
      .eq("id", application.buyer_organization_id)
      .maybeSingle(),
    supabase
      .from("organizations")
      .select("name")
      .eq("id", application.owner_organization_id)
      .maybeSingle(),
    supabase
      .from("verification_runs")
      .select(
        "id,overall_result,completed_at,rule_version,verification_checks(rule_code,result,explanation,evidence)",
      )
      .eq("application_id", application.id)
      .eq("status", "completed")
      .eq("rule_version", "verification-v1")
      .order("completed_at", { ascending: false })
      .limit(1),
    supabase
      .from("audit_events")
      .select("id,action,created_at")
      .eq("application_id", application.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("confirmations")
      .select(
        "id,status,approval_id,reason,representative_name,representative_job_title,representative_email,decided_at",
      )
      .eq("application_id", application.id)
      .maybeSingle(),
    supabase
      .from("offers")
      .select("id,status,decision_kind,response_reason")
      .eq("application_id", application.id)
      .maybeSingle(),
  ]);
  if (
    documentsError ||
    buyerError ||
    ownerError ||
    verificationError ||
    auditError ||
    confirmationError ||
    offerError
  )
    throw new Error("Unable to load the private application workflow.");
  const { data: systemRunRaw } = await integrationDb
    .from("integration_sync_runs")
    .select(
      "id,outcome,completed_at,integration_checks(id,rule_code,result,title,explanation)",
    )
    .eq("application_id", application.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const systemRun = parseSystemRun(systemRunRaw);
  const completedKinds = (documents ?? [])
    .filter((document) => document.upload_completed_at)
    .map((document) => document.kind);
  const progress = deriveApplicationProgress(application, completedKinds);
  const amount =
    application.invoice_total_minor === null
      ? "Amount pending"
      : new Intl.NumberFormat("en-ZA", {
          style: "currency",
          currency: application.currency,
        }).format(application.invoice_total_minor / 100);
  const storedDocuments = (documents ?? []).map((document) => ({
    id: document.id,
    kind: document.kind,
    originalFilename: document.original_filename,
    storagePath: document.storage_path,
    byteSize: document.byte_size,
    pageCount: document.page_count,
    uploadCompletedAt: document.upload_completed_at,
  }));
  const documentOrder = ["purchase_order", "delivery_evidence", "invoice"];
  const extractedDocuments = (documents ?? [])
    .filter(
      (document) =>
        document.extraction_status === "extracted" &&
        document.document_fields.length > 0,
    )
    .sort(
      (a, b) => documentOrder.indexOf(a.kind) - documentOrder.indexOf(b.kind),
    );
  const reviewDocuments: ReviewDocument[] = await Promise.all(
    extractedDocuments.map(async (document) => {
      const { data } = await supabase.storage
        .from("application-documents")
        .createSignedUrl(document.storage_path, 300);
      return {
        id: document.id,
        kind: document.kind,
        filename: document.original_filename,
        previewUrl: data?.signedUrl ?? null,
        fields: document.document_fields.map((field) => ({
          id: field.id,
          name: field.field_name,
          normalizedValue: primitive(field.normalized_value),
        })),
      };
    }),
  );
  const currentStep = progress.steps[progress.currentIndex].id;
  const latestRun = verificationRuns?.[0] ?? null;
  const checks = (latestRun?.verification_checks ?? [])
    .map((check) => parseVerificationCheck(check.evidence))
    .filter((check): check is VerificationCheck => check !== null)
    .sort((a, b) => a.ruleId.localeCompare(b.ruleId));
  const overallResult = latestRun?.overall_result as
    VerificationStatus | null | undefined;
  const showVerification = [
    "sme_reviewed",
    "checks_complete",
    "buyer_system_checking",
    "buyer_system_verified",
    "buyer_exception_review",
    "buyer_system_blocked",
    "buyer_pending",
    "buyer_confirmed",
    "buyer_disputed",
    "funder_review",
    "offer_made",
    "offer_accepted",
    "offer_declined",
    "funded_simulated",
  ].includes(application.status);
  const sourceDocuments = storedDocuments.map((document) => ({
    id: document.id,
    label:
      document.kind === "purchase_order"
        ? "purchase order"
        : document.kind === "delivery_evidence"
          ? "delivery evidence"
          : "invoice",
  }));
  if (session.role === "funder") {
    const { data: complianceCheck } = await integrationDb
      .from("external_compliance_checks")
      .select("status,provider_name,external_reference,completed_at,expires_at")
      .eq("application_id", application.id)
      .maybeSingle();
    const funderDocuments = await Promise.all(
      (documents ?? []).map(async (document) => {
        const { data } = await supabase.storage
          .from("application-documents")
          .createSignedUrl(document.storage_path, 300);
        return {
          id: document.id,
          label:
            document.kind === "purchase_order"
              ? "Purchase order"
              : document.kind === "delivery_evidence"
                ? "Delivery evidence"
                : "Invoice",
          filename: document.original_filename,
          previewUrl: data?.signedUrl ?? null,
          fields: document.document_fields.map((field) => ({
            label: field.field_name.replaceAll("_", " "),
            value:
              primitive(field.normalized_value) === null
                ? "Missing"
                : String(primitive(field.normalized_value)),
          })),
        };
      }),
    );
    return (
      <div className="page-enter mx-auto max-w-7xl">
        <PageHeading
          eyebrow={`Funder review · ${application.id.slice(0, 8).toUpperCase()}`}
          title={application.invoice_number ?? "Evidence package"}
          description="Review the source evidence, deterministic checks, and large-customer evidence before making your own independent funding decision."
        />
        {systemRun && (
          <div className="mt-8">
            <BuyerSystemEvidence
              applicationId={application.id}
              outcome={systemRun.outcome}
              checkedAt={systemRun.completedAt}
              checks={systemRun.checks}
              viewer="funder"
            />
          </div>
        )}
        <div className="mt-8">
          <ExternalCompliancePanel applicationId={application.id} check={complianceCheck as never} />
        </div>
        <div className="mt-8">
          <FunderApplicationReview
            applicationId={application.id}
            status={application.status}
            supplier={owner?.name ?? "Private supplier"}
            buyer={buyer?.name ?? "Private customer"}
            invoice={application.invoice_number ?? "Invoice unavailable"}
            purchaseOrder={
              application.purchase_order_reference ?? "PO unavailable"
            }
            invoiceMinor={application.invoice_total_minor ?? 0}
            currency={application.currency}
            dueDate={application.invoice_due_on ?? "1970-01-01"}
            documents={funderDocuments}
            checks={checks.map((check) => ({
              code: check.ruleId,
              result: check.status,
              explanation: check.explanation,
            }))}
            confirmation={
              confirmation?.status === "confirmed" &&
              confirmation.approval_id &&
              confirmation.representative_name &&
              confirmation.representative_job_title &&
              confirmation.representative_email &&
              confirmation.decided_at
                ? {
                    id: confirmation.id,
                    name: confirmation.representative_name,
                    role: confirmation.representative_job_title,
                    email: confirmation.representative_email,
                    decidedAt: confirmation.decided_at,
                    approvalId: confirmation.approval_id,
                  }
                : null
            }
            audit={(auditEvents ?? []).map((event) => ({
              id: event.id,
              label: event.action.replaceAll("_", " ").replaceAll(".", " · "),
              time: event.created_at,
            }))}
          />
        </div>
      </div>
    );
  }
  return (
    <ApplicationTaskLayout {...progress}>
      <div className="page-enter">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status="neutral">
            {applicationStatusLabel(application.status)}
          </StatusBadge>
          <span className="text-xs font-semibold text-[var(--muted)]">
            {buyer?.name ?? "Private customer"} · {amount}
          </span>
        </div>
        <div className="mt-4">
          <PageHeading
            eyebrow={`Application · ${application.id.slice(0, 8).toUpperCase()}`}
            title={application.invoice_number ?? "Private draft"}
            description="Your details are saved. Continue one evidence step at a time; progress is kept securely in your hosted workspace."
          />
        </div>
        {offer && (
          <Alert
            tone={
              offer.status === "offered" || offer.status === "accepted"
                ? "success"
                : "error"
            }
            title={
              offer.decision_kind === "decline"
                ? "Funder declined this application"
                : offer.status === "offered"
                  ? "Indicative offer ready"
                  : offer.status === "accepted"
                    ? "Indicative offer accepted"
                    : "Indicative offer declined"
            }
            className="mt-6"
          >
            <p>
              {offer.decision_kind === "decline"
                ? offer.response_reason
                : "Review the transparent terms and record your response."}
            </p>
            <Link
              href={`/offers/${offer.id}`}
              className="mt-3 inline-flex min-h-11 items-center rounded-xl border border-[var(--border)] bg-white px-4 font-bold text-[var(--primary)]"
            >
              View indicative offer
            </Link>
          </Alert>
        )}
        {confirmation?.status === "confirmed" && confirmation.approval_id && (
          <Alert
            tone="success"
            title="Large customer confirmation completed"
            className="mt-6"
          >
            <p>
              The signed confirmation is part of this application’s audit trail.
            </p>
            <Link
              href={`/confirmations/${confirmation.id}/certificate`}
              target="_blank"
              className="mt-3 inline-flex min-h-11 items-center rounded-xl border border-[#9bc8b8] bg-white px-4 font-bold text-[var(--primary)]"
            >
              View Confirmation Certificate
            </Link>
          </Alert>
        )}
        {confirmation?.status === "disputed" && (
          <Alert
            tone="error"
            title="Large customer disputed this receivable"
            className="mt-6"
          >
            <p>
              {confirmation.reason ??
                "Review the customer confirmation record for details."}
            </p>
            <Link
              href={`/confirmations/${confirmation.id}`}
              className="mt-3 inline-flex min-h-11 items-center rounded-xl border border-[#efc6c2] bg-white px-4 font-bold text-[var(--error)]"
            >
              View customer response
            </Link>
          </Alert>
        )}
        <div className="mt-8">
          <ApplicationDetailsReceipt
            buyer={buyer?.name ?? "Private customer"}
            purchaseOrder={application.purchase_order_reference}
            amount={amount}
            dueDate={application.invoice_due_on}
          />
        </div>
        {systemRun && (
          <div className="mt-8">
            <BuyerSystemEvidence
              applicationId={application.id}
              outcome={systemRun.outcome}
              checkedAt={systemRun.completedAt}
              checks={systemRun.checks}
              viewer="sme"
            />
          </div>
        )}
        {currentStep === "review" &&
          application.status === "documents_uploaded" && (
            <div className="mt-8">
              <ReviewReadyPanel
                applicationId={application.id}
              />
            </div>
          )}
        {currentStep === "review" &&
          application.status === "fields_extracted" &&
          reviewDocuments.length === 3 && (
            <div className="mt-8">
              <EvidenceEntryWorkspace
                applicationId={application.id}
                documents={reviewDocuments}
              />
            </div>
          )}
        {showVerification && (
          <div className="mt-8">
            <VerificationPanel
              applicationId={application.id}
              status={application.status}
              overallResult={overallResult ?? null}
              checks={checks}
              completedAt={latestRun?.completed_at ?? null}
              sourceDocuments={sourceDocuments}
            />
          </div>
        )}
        <div className="mt-8">
          <DocumentUploadPanel
            applicationId={application.id}
            status={application.status}
            documents={storedDocuments}
          />
        </div>
        <div className="mt-8">
          <ApplicationActivity
            events={(auditEvents ?? []).map((event) => ({
              id: event.id,
              action: event.action,
              createdAt: event.created_at,
            }))}
          />
        </div>
      </div>
    </ApplicationTaskLayout>
  );
}

function primitive(value: unknown): string | boolean | null {
  return typeof value === "string" || typeof value === "boolean" ? value : null;
}

function applicationStatusLabel(status: string) {
  const labels: Record<string, string> = {
    buyer_system_checking: "Automated verification running",
    buyer_system_verified: "Automated verification complete",
    buyer_exception_review: "Large customer review needed",
    buyer_system_blocked: "Application cannot proceed",
  };
  return labels[status] ?? status.replaceAll("_", " ");
}

function parseVerificationCheck(value: unknown): VerificationCheck | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const check = value as Record<string, unknown>;
  if (
    typeof check.ruleId !== "string" ||
    !/^V\d{3}$/.test(check.ruleId) ||
    check.version !== "verification-v1" ||
    !["pass", "review", "fail"].includes(String(check.status)) ||
    !["info", "warning", "blocking"].includes(String(check.severity)) ||
    typeof check.title !== "string" ||
    typeof check.explanation !== "string" ||
    !check.comparedValues ||
    typeof check.comparedValues !== "object" ||
    Array.isArray(check.comparedValues) ||
    !Array.isArray(check.sourceDocumentIds)
  )
    return null;
  const comparedValues = Object.fromEntries(
    Object.entries(check.comparedValues as Record<string, unknown>).filter(
      (entry): entry is [string, string | null] =>
        entry[1] === null || typeof entry[1] === "string",
    ),
  );
  const sourceDocumentIds = check.sourceDocumentIds.filter(
    (id): id is string => typeof id === "string",
  );
  return {
    ruleId: check.ruleId as VerificationCheck["ruleId"],
    version: "verification-v1",
    status: check.status as VerificationCheck["status"],
    severity: check.severity as VerificationCheck["severity"],
    title: check.title,
    explanation: check.explanation,
    comparedValues,
    sourceDocumentIds,
  };
}

function parseSystemRun(value: unknown): {
  outcome: string;
  completedAt: string;
  checks: BuyerSystemCheckView[];
} | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (
    typeof row.outcome !== "string" ||
    typeof row.completed_at !== "string" ||
    !Array.isArray(row.integration_checks)
  )
    return null;
  const checks = row.integration_checks.flatMap(
    (item): BuyerSystemCheckView[] => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return [];
      const check = item as Record<string, unknown>;
      if (
        typeof check.id !== "string" ||
        typeof check.rule_code !== "string" ||
        typeof check.title !== "string" ||
        typeof check.explanation !== "string" ||
        !["pass", "review", "fail"].includes(String(check.result))
      )
        return [];
      return [
        {
          id: check.id,
          code: check.rule_code,
          result: check.result as BuyerSystemCheckView["result"],
          title: check.title,
          explanation: check.explanation,
        },
      ];
    },
  );
  return { outcome: row.outcome, completedAt: row.completed_at, checks };
}
