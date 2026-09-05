import type { CanonicalEvidence } from "./evidence-v1";

export type CoupaRuleResult = {
  ruleId: `C${string}`;
  result: "pass" | "review" | "fail";
  title: string;
  explanation: string;
  evidence: Record<string, unknown>;
};
export type SupplierEvidence = {
  supplierId: string;
  supplierName: string;
  supplierMapped?: boolean;
  purchaseOrderNumber: string;
  invoiceNumber: string;
  totalMinor: number;
  currency: string;
  dueDate: string | null;
};
export type CoupaOutcome = "system_verified" | "review_required" | "blocked";

const normalize = (value: string) =>
  value.toUpperCase().replace(/[^A-Z0-9]/g, "");
const result = (
  ruleId: CoupaRuleResult["ruleId"],
  title: string,
  passed: boolean,
  explanation: string,
  evidence: Record<string, unknown>,
  failed: "review" | "fail" = "review",
): CoupaRuleResult => ({
  ruleId,
  title,
  result: passed ? "pass" : failed,
  explanation,
  evidence,
});

export function runCoupaRulesV1(
  source: SupplierEvidence,
  external: CanonicalEvidence,
): { checks: CoupaRuleResult[]; outcome: CoupaOutcome } {
  const supplier = external.supplier;
  const po = external.purchaseOrder;
  const invoice = external.invoice;
  const payment = external.paymentStatus;
  const checks: CoupaRuleResult[] = [
    result(
      "C001",
      "Customer connection",
      true,
      "Authorised customer system connection responded successfully.",
      { provider: external.provider, mode: external.providerMode },
    ),
    result(
      "C002",
      "Supplier mapping",
      source.supplierMapped !== false && Boolean(supplier),
      source.supplierMapped !== false && supplier
        ? "The supplier mapping was found."
        : "No mapped supplier was found.",
      {
        proofFlowSupplier: source.supplierName,
        coupaSupplier: supplier?.name ?? null,
      },
    ),
    result(
      "C003",
      "Purchase order",
      Boolean(po),
      po
        ? "The purchase order exists in Authorised customer system."
        : "The purchase order was not found.",
      {
        purchaseOrder: source.purchaseOrderNumber,
        externalId: po?.externalId ?? null,
      },
    ),
    result(
      "C004",
      "PO supplier",
      Boolean(po && supplier && po.supplierId === supplier.externalId),
      "The purchase order must belong to the mapped supplier.",
      {
        poSupplierId: po?.supplierId ?? null,
        mappedSupplierId: supplier?.externalId ?? null,
      },
    ),
    result(
      "C005",
      "Invoice",
      Boolean(invoice),
      invoice
        ? "The invoice exists in Authorised customer system."
        : "Invoice not found — customer review required.",
      {
        invoiceNumber: source.invoiceNumber,
        externalId: invoice?.externalId ?? null,
      },
    ),
    result(
      "C006",
      "Invoice PO reference",
      Boolean(
        invoice &&
        normalize(invoice.purchaseOrderNumber ?? "") ===
          normalize(source.purchaseOrderNumber),
      ),
      "The invoice must reference the submitted purchase order.",
      {
        submitted: source.purchaseOrderNumber,
        coupa: invoice?.purchaseOrderNumber ?? null,
      },
    ),
    result(
      "C007",
      "Amount and currency",
      Boolean(
        invoice &&
        invoice.totalMinor === source.totalMinor &&
        invoice.currency === source.currency,
      ),
      invoice && invoice.totalMinor !== source.totalMinor
        ? "Amount mismatch — customer review required."
        : "The invoice amount and currency must match.",
      {
        submittedMinor: source.totalMinor,
        coupaMinor: invoice?.totalMinor ?? null,
        submittedCurrency: source.currency,
        coupaCurrency: invoice?.currency ?? null,
      },
    ),
    result(
      "C008",
      "Delivery receipt",
      external.receipts.length > 0,
      external.receipts.length
        ? "A receiving transaction exists."
        : "Delivery not confirmed — customer review required.",
      { receiptCount: external.receipts.length },
    ),
    result(
      "C009",
      "Outstanding status",
      Boolean(
        payment &&
        payment.status !== "paid" &&
        (payment.outstandingMinor ?? 0) > 0,
      ),
      payment?.status === "paid"
        ? "Invoice is not outstanding — application cannot proceed."
        : "The invoice must remain outstanding.",
      {
        status: payment?.status ?? null,
        outstandingMinor: payment?.outstandingMinor ?? null,
      },
      payment?.status === "paid" ? "fail" : "review",
    ),
    result(
      "C010",
      "Expected payment date",
      Boolean(payment && payment.expectedPaymentDate === source.dueDate),
      "The expected payment date must match.",
      {
        submitted: source.dueDate,
        coupa: payment?.expectedPaymentDate ?? null,
      },
    ),
  ];
  return {
    checks,
    outcome: checks.some((check) => check.result === "fail")
      ? "blocked"
      : checks.some((check) => check.result === "review")
        ? "review_required"
        : "system_verified",
  };
}
