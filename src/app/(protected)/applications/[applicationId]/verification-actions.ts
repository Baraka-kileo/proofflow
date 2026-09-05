"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireApplicationAccess, requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { normalizeReference } from "@/lib/verification/normalizers";
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
      message: "Every required evidence field must be entered before verification.",
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
      message: "All three submitted evidence categories are required.",
    };
  const normalizedInvoiceNumber = normalizeReference(
    typeof invoice.fields.invoice_number === "string"
      ? invoice.fields.invoice_number
      : null,
  );
  if (!normalizedInvoiceNumber)
    return {
      status: "error",
      message: "The submitted invoice number is missing or invalid.",
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
      message: "This application cannot be sent to the large customer.",
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
        "Resolve any failed checks before requesting customer confirmation.",
    };
  revalidatePath(`/applications/${application.id}`);
  revalidatePath("/dashboard");
  return {
    status: "success",
    message: "Customer confirmation requested securely.",
  };
}

export async function checkBuyerSystem(
  applicationId: string,
  previous: VerificationActionState,
): Promise<VerificationActionState> {
  void previous;
  const parsedId = z.uuid().safeParse(applicationId);
  if (!parsedId.success)
    return { status: "error", message: "The application could not be identified." };

  const session = await requireRole("sme");
  const { application } = await requireApplicationAccess(parsedId.data);
  if (application.owner_organization_id !== session.organizationId)
    return { status: "error", message: "This application is not available." };

  return {
    status: "error",
    message:
      "No authorised customer-system integration is configured for this application. Request authenticated customer confirmation instead.",
  };
}
