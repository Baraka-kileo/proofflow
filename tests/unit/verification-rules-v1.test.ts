import { describe, expect, it } from "vitest";
import { calculateOverallResult, runVerificationRulesV1, type VerificationContext } from "@/lib/verification/rules-v1";

function validContext(): VerificationContext {
  return {
    purchaseOrder: { id: "po-id", kind: "purchase_order", sha256: "a", fields: { buyer_legal_name: "Ubuntu Retail Group", supplier_legal_name: "Ndlovu Office Supply", purchase_order_reference: "PO-1042", issue_date: "2026-08-20", currency: "ZAR", order_total: "48750.25" } },
    deliveryEvidence: { id: "delivery-id", kind: "delivery_evidence", sha256: "b", fields: { buyer_legal_name: "Ubuntu Retail Group", supplier_legal_name: "Ndlovu Office Supply", purchase_order_reference: "PO 1042", delivery_or_completion_date: "2026-08-21", receiver_or_signature_present: true } },
    invoice: { id: "invoice-id", kind: "invoice", sha256: "c", fields: { buyer_legal_name: "Ubuntu Retail Group", supplier_legal_name: "Ndlovu Office Supply", invoice_number: "INV-1042", purchase_order_reference: "po/1042", issue_date: "2026-08-22", due_date: "2026-10-21", currency: "zar", subtotal: "42391.52", tax: "6358.73", total: "48750.25" } },
    duplicateFileHash: false,
    duplicateInvoiceIdentity: false,
    buyerConfirmation: "confirmed",
  };
}

describe("verification rules v1", () => {
  it("returns twelve explainable, source-linked passing checks for a consistent confirmed pack", () => {
    const checks = runVerificationRulesV1(validContext());
    expect(checks).toHaveLength(12);
    expect(checks.map((check) => check.ruleId)).toEqual(Array.from({ length: 12 }, (_, index) => `V${String(index + 1).padStart(3, "0")}`));
    expect(checks.every((check) => check.version === "verification-v1" && check.explanation.length > 0)).toBe(true);
    expect(calculateOverallResult(checks)).toBe("pass");
  });

  it.each([
    ["V001", (context: VerificationContext) => { context.invoice.fields.buyer_legal_name = "Different Buyer"; }],
    ["V002", (context: VerificationContext) => { context.invoice.fields.supplier_legal_name = "Different Supplier"; }],
    ["V003", (context: VerificationContext) => { context.invoice.fields.purchase_order_reference = "PO-9999"; }],
    ["V004", (context: VerificationContext) => { context.invoice.fields.currency = "USD"; }],
    ["V005", (context: VerificationContext) => { context.invoice.fields.total = "50000.00"; }],
    ["V006", (context: VerificationContext) => { context.invoice.fields.tax = "1.00"; }],
    ["V007", (context: VerificationContext) => { context.purchaseOrder.fields.issue_date = "2026-08-23"; }],
    ["V008", (context: VerificationContext) => { context.deliveryEvidence.fields.delivery_or_completion_date = "2026-08-23"; }],
    ["V009", (context: VerificationContext) => { context.duplicateFileHash = true; }],
    ["V010", (context: VerificationContext) => { context.duplicateInvoiceIdentity = true; }],
    ["V012", (context: VerificationContext) => { context.buyerConfirmation = "disputed"; }],
  ])("returns fail for a blocking %s contradiction", (ruleId, mutate) => {
    const context = validContext();
    mutate(context);
    const check = runVerificationRulesV1(context).find((candidate) => candidate.ruleId === ruleId);
    expect(check).toMatchObject({ status: "fail", severity: "blocking" });
    expect(check?.comparedValues).toBeTruthy();
  });

  it.each([
    ["V001", (context: VerificationContext) => { context.invoice.fields.buyer_legal_name = null; }],
    ["V002", (context: VerificationContext) => { context.deliveryEvidence.fields.supplier_legal_name = null; }],
    ["V003", (context: VerificationContext) => { context.deliveryEvidence.fields.purchase_order_reference = null; }],
    ["V004", (context: VerificationContext) => { context.invoice.fields.currency = null; }],
    ["V005", (context: VerificationContext) => { context.invoice.fields.total = "47000.00"; }],
    ["V006", (context: VerificationContext) => { context.invoice.fields.tax = null; }],
    ["V007", (context: VerificationContext) => { context.purchaseOrder.fields.issue_date = null; }],
    ["V008", (context: VerificationContext) => { context.deliveryEvidence.fields.delivery_or_completion_date = null; }],
    ["V011", (context: VerificationContext) => { context.deliveryEvidence.fields.receiver_or_signature_present = false; }],
    ["V012", (context: VerificationContext) => { context.buyerConfirmation = "pending"; }],
  ])("returns review for a non-blocking %s uncertainty", (ruleId, mutate) => {
    const context = validContext();
    mutate(context);
    expect(runVerificationRulesV1(context).find((candidate) => candidate.ruleId === ruleId)).toMatchObject({ status: "review", severity: "warning" });
  });

  it("uses fail before review when calculating the overall evidence result", () => {
    const context = validContext();
    context.buyerConfirmation = "pending";
    context.duplicateInvoiceIdentity = true;
    expect(calculateOverallResult(runVerificationRulesV1(context))).toBe("fail");
  });
});
