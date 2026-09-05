import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runVerificationRulesV1 } from "@/lib/verification/rules-v1";

const root = path.resolve("samples/evidence-packs");
const names = ["purchase-order.pdf", "delivery-evidence.pdf", "invoice.pdf"];
const hash = (value: Buffer) => createHash("sha256").update(value).digest("hex");

describe("synthetic evidence packs", () => {
  it.each(["valid", "mismatch", "duplicate"])("contains a complete %s PDF set", async (pack) => {
    for (const name of names) {
      const value = await readFile(path.join(root, pack, name));
      expect(value.subarray(0, 4).toString()).toBe("%PDF");
      expect(value.byteLength).toBeGreaterThan(2_000);
    }
  });

  it("keeps the duplicate pack byte-identical to the valid pack", async () => {
    for (const name of names) {
      const [valid, duplicate] = await Promise.all([
        readFile(path.join(root, "valid", name)),
        readFile(path.join(root, "duplicate", name)),
      ]);
      expect(hash(duplicate)).toBe(hash(valid));
    }
  });

  it("documents the deliberately contradictory rule outcomes", async () => {
    const expected = JSON.parse(await readFile(path.join(root, "mismatch", "expected.json"), "utf8"));
    expect(expected.synthetic).toBe(true);
    expect(expected.expectedRulesBeforeBuyer).toMatchObject({
      V001: "fail",
      V003: "fail",
      V004: "fail",
      V005: "fail",
      V006: "fail",
      V007: "fail",
      V008: "fail",
      V011: "review",
      V012: "review",
    });
    const checks = runVerificationRulesV1({
      purchaseOrder: { id: "po", kind: "purchase_order", sha256: "po-hash", fields: { buyer_legal_name: expected.documents.purchase_order.buyerLegalName, supplier_legal_name: expected.documents.purchase_order.supplierLegalName, purchase_order_reference: expected.documents.purchase_order.purchaseOrderReference, issue_date: expected.documents.purchase_order.issueDate, currency: expected.documents.purchase_order.currency, order_total: expected.documents.purchase_order.orderTotal } },
      deliveryEvidence: { id: "delivery", kind: "delivery_evidence", sha256: "delivery-hash", fields: { buyer_legal_name: expected.documents.delivery_evidence.buyerLegalName, supplier_legal_name: expected.documents.delivery_evidence.supplierLegalName, purchase_order_reference: expected.documents.delivery_evidence.purchaseOrderReference, delivery_or_completion_date: expected.documents.delivery_evidence.deliveryOrCompletionDate, receiver_or_signature_present: expected.documents.delivery_evidence.receiverOrSignaturePresent } },
      invoice: { id: "invoice", kind: "invoice", sha256: "invoice-hash", fields: { buyer_legal_name: expected.documents.invoice.buyerLegalName, supplier_legal_name: expected.documents.invoice.supplierLegalName, purchase_order_reference: expected.documents.invoice.purchaseOrderReference, invoice_number: expected.documents.invoice.invoiceNumber, issue_date: expected.documents.invoice.issueDate, due_date: expected.documents.invoice.dueDate, currency: expected.documents.invoice.currency, subtotal: expected.documents.invoice.subtotal, tax: expected.documents.invoice.tax, total: expected.documents.invoice.total } },
      duplicateFileHash: false,
      duplicateInvoiceIdentity: false,
      buyerConfirmation: "pending",
    });
    expect(Object.fromEntries(checks.map((check) => [check.ruleId, check.status]))).toEqual(expected.expectedRulesBeforeBuyer);
  });

  it("proves the duplicate pack produces a V009 failure", async () => {
    const expected = JSON.parse(await readFile(path.join(root, "valid", "expected.json"), "utf8"));
    const checks = runVerificationRulesV1({
      purchaseOrder: { id: "po", kind: "purchase_order", sha256: "same", fields: { buyer_legal_name: expected.documents.purchase_order.buyerLegalName, supplier_legal_name: expected.documents.purchase_order.supplierLegalName, purchase_order_reference: expected.documents.purchase_order.purchaseOrderReference, issue_date: expected.documents.purchase_order.issueDate, currency: expected.documents.purchase_order.currency, order_total: expected.documents.purchase_order.orderTotal } },
      deliveryEvidence: { id: "delivery", kind: "delivery_evidence", sha256: "delivery", fields: { buyer_legal_name: expected.documents.delivery_evidence.buyerLegalName, supplier_legal_name: expected.documents.delivery_evidence.supplierLegalName, purchase_order_reference: expected.documents.delivery_evidence.purchaseOrderReference, delivery_or_completion_date: expected.documents.delivery_evidence.deliveryOrCompletionDate, receiver_or_signature_present: expected.documents.delivery_evidence.receiverOrSignaturePresent } },
      invoice: { id: "invoice", kind: "invoice", sha256: "invoice", fields: { buyer_legal_name: expected.documents.invoice.buyerLegalName, supplier_legal_name: expected.documents.invoice.supplierLegalName, purchase_order_reference: expected.documents.invoice.purchaseOrderReference, invoice_number: expected.documents.invoice.invoiceNumber, issue_date: expected.documents.invoice.issueDate, due_date: expected.documents.invoice.dueDate, currency: expected.documents.invoice.currency, subtotal: expected.documents.invoice.subtotal, tax: expected.documents.invoice.tax, total: expected.documents.invoice.total } },
      duplicateFileHash: true,
      duplicateInvoiceIdentity: false,
      buyerConfirmation: "pending",
    });
    expect(checks.find((check) => check.ruleId === "V009")?.status).toBe("fail");
  });
});
