"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireApplicationAccess, requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { normalizeReference } from "@/lib/verification/normalizers";
import {
  DemoCoupaConnector,
  demoCoupaScenarios,
  retrieveDemoCoupaEvidence,
} from "@/lib/integrations/demo-coupa";
import { runCoupaRulesV1 } from "@/lib/integrations/rules-v1";
import { withSafeRetry } from "@/lib/integrations/resilience";
import {
  calculateOverallResult,
  runVerificationRulesV1,
  VERIFICATION_RULE_VERSION,
  type DocumentKind,
  type FieldValue,
  type VerificationDocument,
} from "@/lib/verification/rules-v1";

export type VerificationActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

function safeFieldValue(value: unknown): FieldValue {
  return typeof value === "string" || typeof value === "boolean" ? value : null;
}

export async function runApplicationVerification(
  applicationId: string,
  previous: VerificationActionState,
): Promise<VerificationActionState> {
  void previous;
  const parsedId = z.uuid().safeParse(applicationId);
  if (!parsedId.success)
    return {
      status: "error",
      message: "The application could not be identified.",
    };
  const session = await requireRole("sme");
  const { application } = await requireApplicationAccess(parsedId.data);
  if (
    application.owner_organization_id !== session.organizationId ||
    !["sme_reviewed", "checks_complete"].includes(application.status)
  ) {
    return {
      status: "error",
      message: "This application is not ready for verification.",
    };
  }

  const supabase = await createClient();
  const [
    { data: documentRows, error: documentsError },
    { data: otherApplications, error: applicationsError },
    { data: otherDocuments, error: hashesError },
    { data: confirmation, error: confirmationError },
  ] = await Promise.all([
    supabase
      .from("documents")
      .select(
        "id,kind,sha256,extraction_status,document_fields(field_name,normalized_value,review_status)",
      )
      .eq("application_id", application.id),
    supabase
      .from("applications")
      .select("id,invoice_number,normalized_invoice_number")
      .eq("owner_organization_id", application.owner_organization_id)
      .neq("id", application.id),
    supabase
      .from("documents")
      .select("application_id,sha256")
      .eq("owner_organization_id", application.owner_organization_id)
      .neq("application_id", application.id)
      .not("upload_completed_at", "is", null),
    supabase
      .from("confirmations")
      .select("status")
      .eq("application_id", application.id)
      .maybeSingle(),
  ]);
  if (documentsError || applicationsError || hashesError || confirmationError)
    return {
      status: "error",
      message: "The evidence checks could not be prepared. Please try again.",
    };
  if (
    documentRows?.length !== 3 ||
    documentRows.some(
      (document) =>
        document.extraction_status !== "reviewed" ||
        document.document_fields.some(
          (field) => field.review_status === "unreviewed",
        ),
    )
  ) {
    return {
      status: "error",
      message: "Every extracted field must be reviewed before verification.",
    };
  }

  const documents = new Map<DocumentKind, VerificationDocument>();
  for (const document of documentRows) {
    documents.set(document.kind, {
      id: document.id,
      kind: document.kind,
      sha256: document.sha256,
      fields: Object.fromEntries(
        document.document_fields.map((field) => [
          field.field_name,
          safeFieldValue(field.normalized_value),
        ]),
      ),
    });
  }
  const purchaseOrder = documents.get("purchase_order");
  const deliveryEvidence = documents.get("delivery_evidence");
  const invoice = documents.get("invoice");
  if (!purchaseOrder || !deliveryEvidence || !invoice)
    return {
      status: "error",
      message: "All three reviewed evidence categories are required.",
    };
  const normalizedInvoiceNumber = normalizeReference(
    typeof invoice.fields.invoice_number === "string"
      ? invoice.fields.invoice_number
      : null,
  );
  if (!normalizedInvoiceNumber)
    return {
      status: "error",
      message: "The reviewed invoice number is missing or invalid.",
    };
  const duplicateInvoiceIdentity = (otherApplications ?? []).some(
    (other) =>
      (other.normalized_invoice_number ??
        normalizeReference(other.invoice_number)) === normalizedInvoiceNumber,
  );
  const currentHashes = new Set([
    purchaseOrder.sha256,
    deliveryEvidence.sha256,
    invoice.sha256,
  ]);
  const duplicateFileHash = (otherDocuments ?? []).some((document) =>
    currentHashes.has(document.sha256),
  );
  const checks = runVerificationRulesV1({
    purchaseOrder,
    deliveryEvidence,
    invoice,
    duplicateFileHash,
    duplicateInvoiceIdentity,
    buyerConfirmation: confirmation?.status ?? "pending",
  });
  const overallResult = calculateOverallResult(checks);
  const { error } = await supabase.rpc("persist_verification_run_v1", {
    target_application_id: application.id,
    target_rule_version: VERIFICATION_RULE_VERSION,
    target_overall_result: overallResult,
    target_normalized_invoice_number: normalizedInvoiceNumber,
    checks,
  });
  if (error)
    return {
      status: "error",
      message:
        "The complete verification run was not saved. Please reload and try again.",
    };
  revalidatePath(`/applications/${application.id}`);
  revalidatePath("/dashboard");
  return {
    status: "success",
    message: `Verification completed with an overall ${overallResult} result.`,
  };
}

export async function sendApplicationToBuyer(
  applicationId: string,
  previous: VerificationActionState,
): Promise<VerificationActionState> {
  void previous;
  const parsedId = z.uuid().safeParse(applicationId);
  if (!parsedId.success)
    return {
      status: "error",
      message: "The application could not be identified.",
    };
  const session = await requireRole("sme");
  const { application } = await requireApplicationAccess(parsedId.data);
  if (
    application.owner_organization_id !== session.organizationId ||
    !["checks_complete", "buyer_pending"].includes(application.status)
  ) {
    return {
      status: "error",
      message: "This application cannot be sent to the buyer.",
    };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("send_application_to_buyer", {
    target_application_id: application.id,
  });
  if (error)
    return {
      status: "error",
      message:
        "Resolve any failed checks before requesting buyer confirmation.",
    };
  revalidatePath(`/applications/${application.id}`);
  revalidatePath("/dashboard");
  return {
    status: "success",
    message: "Buyer confirmation requested securely.",
  };
}

const connectionSchema = z.object({
  id: z.uuid(),
  status: z.enum(["active", "disconnected", "error", "revoked"]),
  mode: z.enum(["demo", "live"]),
  demo_scenario: z.enum(demoCoupaScenarios),
});
const mappingSchema = z.object({
  external_supplier_id: z.string().min(1),
  external_supplier_name: z.string().min(1),
  status: z.string(),
});

export async function checkBuyerSystem(
  applicationId: string,
  previous: VerificationActionState,
): Promise<VerificationActionState> {
  void previous;
  const parsedId = z.uuid().safeParse(applicationId);
  if (!parsedId.success)
    return {
      status: "error",
      message: "The application could not be identified.",
    };
  const session = await requireRole("sme");
  const { application } = await requireApplicationAccess(parsedId.data);
  if (
    application.owner_organization_id !== session.organizationId ||
    ![
      "checks_complete",
      "buyer_exception_review",
      "buyer_system_blocked",
      "buyer_system_verified",
      "buyer_pending",
    ].includes(application.status)
  )
    return {
      status: "error",
      message: "This application is not ready for automated verification.",
    };
  if (
    !application.purchase_order_reference ||
    !application.invoice_number ||
    application.invoice_total_minor === null
  )
    return {
      status: "error",
      message: "The reviewed PO, invoice number, and amount are required.",
    };

  const supabase = await createClient();
  const db = supabase as unknown as SupabaseClient;
  const [{ data: contextRaw }, { data: latestRun }, { data: owner }] =
    await Promise.all([
      db.rpc("get_demo_coupa_context", {
        target_application_id: application.id,
      }),
      supabase
        .from("verification_runs")
        .select("id")
        .eq("application_id", application.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("organizations")
        .select("name")
        .eq("id", application.owner_organization_id)
        .maybeSingle(),
    ]);
  const context = z
    .object({ connection: connectionSchema, mapping: mappingSchema.nullable() })
    .safeParse(contextRaw);
  const connection = context.success
    ? { success: true as const, data: context.data.connection }
    : { success: false as const };
  const mapping = mappingSchema.safeParse(
    context.success ? context.data.mapping : null,
  );
  if (!connection.success || connection.data.mode !== "demo")
    return {
      status: "error",
      message:
        "Automated verification is unavailable. Request manual buyer confirmation instead.",
    };
  const correlationId = `coupa-${randomUUID()}`;
  const idempotencyKey = `${latestRun?.id ?? application.id}:${connection.data.demo_scenario}`;
  const transaction = {
    supplierId: mapping.success
      ? mapping.data.external_supplier_id
      : "UNMAPPED",
    supplierName: mapping.success
      ? mapping.data.external_supplier_name
      : (owner?.name ?? "Unmapped supplier"),
    purchaseOrderNumber: application.purchase_order_reference,
    invoiceNumber: application.invoice_number,
    invoiceTotalMinor: application.invoice_total_minor,
    currency: application.currency,
    invoiceDate: application.invoice_issued_on,
    dueDate: application.invoice_due_on,
  };
  const scenario =
    connection.data.status === "active"
      ? connection.data.demo_scenario
      : "disconnected";
  const connector = new DemoCoupaConnector(scenario, transaction);
  let evidence;
  try {
    evidence = await withSafeRetry(
      () => retrieveDemoCoupaEvidence(connector, transaction, correlationId),
      { timeoutMs: 5_000, retries: 1 },
    );
  } catch {
    return {
      status: "error",
      message: "Demo Coupa returned invalid evidence. Nothing was saved.",
    };
  }
  const rules = evidence
    ? runCoupaRulesV1(
        {
          supplierId: transaction.supplierId,
          supplierName: transaction.supplierName,
          supplierMapped: mapping.success && mapping.data.status === "verified",
          purchaseOrderNumber: transaction.purchaseOrderNumber,
          invoiceNumber: transaction.invoiceNumber,
          totalMinor: transaction.invoiceTotalMinor,
          currency: transaction.currency,
          dueDate: transaction.dueDate,
        },
        evidence,
      )
    : null;
  const outcome = rules?.outcome ?? "manual_confirmation_required";
  const { error } = await db.rpc("persist_demo_coupa_result_v1", {
    target_application_id: application.id,
    target_connection_id: connection.data.id,
    target_idempotency_key: idempotencyKey,
    target_correlation_id: correlationId,
    target_outcome: outcome,
    target_evidence: evidence ?? {},
    target_checks: rules?.checks ?? [],
    target_error_code: evidence ? null : "COUPA_UNAVAILABLE",
  });
  if (error)
    return {
      status: "error",
      message:
        "The automated verification result could not be saved. Please try again.",
    };
  revalidatePath(`/applications/${application.id}`);
  revalidatePath("/dashboard");
  revalidatePath("/confirmations");
  const messages = {
    system_verified: "Automated verification completed using Demo Coupa.",
    review_required: "Demo Coupa found a difference. Buyer review is required.",
    blocked: "Demo Coupa reports this invoice cannot proceed.",
    manual_confirmation_required:
      "Demo Coupa is unavailable. Signed buyer confirmation has been requested.",
  };
  return { status: "success", message: messages[outcome] };
}
