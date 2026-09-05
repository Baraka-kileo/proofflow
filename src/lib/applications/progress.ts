import type { Database } from "@/types/database";

type Application = Pick<
  Database["public"]["Tables"]["applications"]["Row"],
  | "status"
  | "buyer_organization_id"
  | "purchase_order_reference"
  | "invoice_number"
  | "invoice_total_minor"
  | "invoice_due_on"
  | "ai_processing_consented_at"
>;
type DocumentKind = Database["public"]["Enums"]["document_kind"];

export type ApplicationStepId = "details" | "documents" | "review" | "verification" | "buyer";
export type ApplicationStepState = "complete" | "current" | "locked";
export type ApplicationStep = {
  id: ApplicationStepId;
  label: string;
  description: string;
  lockedReason?: string;
  state: ApplicationStepState;
};

const requiredDocuments: DocumentKind[] = ["purchase_order", "delivery_evidence", "invoice"];
const statusOrder: Application["status"][] = ["draft", "documents_uploaded", "fields_extracted", "sme_reviewed", "checks_complete", "buyer_pending", "buyer_confirmed", "buyer_disputed", "funder_review", "offer_made", "offer_accepted", "offer_declined", "funded_simulated"];
const reached = (status: Application["status"], milestone: Application["status"]) => statusOrder.indexOf(status) >= statusOrder.indexOf(milestone);

export function deriveApplicationProgress(application: Application | null, documentKinds: DocumentKind[] = []) {
  const detailsComplete = Boolean(
    application?.buyer_organization_id &&
      application.purchase_order_reference &&
      application.invoice_number &&
      application.invoice_total_minor &&
      application.invoice_total_minor > 0 &&
      application.invoice_due_on &&
      application.ai_processing_consented_at,
  );
  const documentsComplete = Boolean(application && requiredDocuments.every((kind) => documentKinds.includes(kind)));
  const reviewComplete = Boolean(application && reached(application.status, "sme_reviewed"));
  const verificationComplete = Boolean(application && reached(application.status, "checks_complete"));
  const buyerComplete = Boolean(application && reached(application.status, "buyer_confirmed"));
  const complete = [detailsComplete, documentsComplete, reviewComplete, verificationComplete, buyerComplete];
  const currentIndex = complete.findIndex((value) => !value);
  const resolvedCurrentIndex = currentIndex === -1 ? 4 : currentIndex;
  const definitions: Array<Omit<ApplicationStep, "state">> = [
    { id: "details", label: "Details", description: "Buyer and invoice context" },
    { id: "documents", label: "Documents", description: "Three private evidence files", lockedReason: "Complete the application details first." },
    { id: "review", label: "Review", description: "Confirm extracted fields", lockedReason: "Upload all three evidence documents first." },
    { id: "verification", label: "Verification", description: "Run explainable checks", lockedReason: "Review and approve the extracted fields first." },
    { id: "buyer", label: "Buyer", description: "Request buyer confirmation", lockedReason: "Complete the verification checks first." },
  ];
  const steps = definitions.map((step, index): ApplicationStep => ({
    ...step,
    state: complete[index] ? "complete" : index === resolvedCurrentIndex ? "current" : "locked",
  }));
  return { steps, currentIndex: resolvedCurrentIndex, completedCount: complete.filter(Boolean).length };
}
