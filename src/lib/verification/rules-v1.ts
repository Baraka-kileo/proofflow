import {
  decimalToMinorUnits,
  normalizeCurrency,
  normalizeIsoDate,
  normalizeName,
  normalizeReference,
} from "./normalizers";

export const VERIFICATION_RULE_VERSION = "verification-v1" as const;
export type VerificationStatus = "pass" | "review" | "fail";
export type VerificationSeverity = "info" | "warning" | "blocking";
export type DocumentKind = "purchase_order" | "delivery_evidence" | "invoice";
export type FieldValue = string | boolean | null;

export type VerificationDocument = {
  id: string;
  kind: DocumentKind;
  sha256: string;
  fields: Record<string, FieldValue>;
};

export type VerificationContext = {
  purchaseOrder: VerificationDocument;
  deliveryEvidence: VerificationDocument;
  invoice: VerificationDocument;
  duplicateFileHash: boolean;
  duplicateInvoiceIdentity: boolean;
  buyerConfirmation: "pending" | "confirmed" | "disputed";
};

export type VerificationCheck = {
  ruleId: `V${string}`;
  version: typeof VERIFICATION_RULE_VERSION;
  status: VerificationStatus;
  severity: VerificationSeverity;
  title: string;
  explanation: string;
  comparedValues: Record<string, string | null>;
  sourceDocumentIds: string[];
};

type RuleDefinition = (context: VerificationContext) => VerificationCheck;

const sourceKeys: Record<DocumentKind, string> = {
  purchase_order: "Purchase order",
  delivery_evidence: "Delivery evidence",
  invoice: "Invoice",
};

function stringField(document: VerificationDocument, field: string) {
  const value = document.fields[field];
  return typeof value === "string" ? value : null;
}

function result(
  ruleId: VerificationCheck["ruleId"],
  title: string,
  status: VerificationStatus,
  explanation: string,
  comparedValues: VerificationCheck["comparedValues"],
  sourceDocumentIds: string[],
): VerificationCheck {
  return {
    ruleId,
    version: VERIFICATION_RULE_VERSION,
    status,
    severity:
      status === "fail" ? "blocking" : status === "review" ? "warning" : "info",
    title,
    explanation,
    comparedValues,
    sourceDocumentIds,
  };
}

function agreementRule(
  ruleId: VerificationCheck["ruleId"],
  title: string,
  field: string,
  documents: VerificationDocument[],
  normalizer: (value: string | null) => string | null,
): VerificationCheck {
  const values = Object.fromEntries(
    documents.map((document) => [
      sourceKeys[document.kind],
      stringField(document, field),
    ]),
  );
  const normalized = Object.values(values).map(normalizer);
  if (normalized.some((value) => value === null)) {
    return result(
      ruleId,
      title,
      "review",
      "One or more documents are missing a usable value, so a person must review this comparison.",
      values,
      documents.map((document) => document.id),
    );
  }
  return new Set(normalized).size === 1
    ? result(
        ruleId,
        title,
        "pass",
        "The reviewed values agree across the source documents.",
        values,
        documents.map((document) => document.id),
      )
    : result(
        ruleId,
        title,
        "fail",
        "The reviewed values contradict one another across the source documents.",
        values,
        documents.map((document) => document.id),
      );
}

export const verificationRulesV1: readonly RuleDefinition[] = [
  (context) =>
    agreementRule(
      "V001",
      "Large customer identity",
      "buyer_legal_name",
      [context.purchaseOrder, context.deliveryEvidence, context.invoice],
      normalizeName,
    ),
  (context) =>
    agreementRule(
      "V002",
      "Supplier identity",
      "supplier_legal_name",
      [context.purchaseOrder, context.deliveryEvidence, context.invoice],
      normalizeName,
    ),
  (context) =>
    agreementRule(
      "V003",
      "Purchase order reference",
      "purchase_order_reference",
      [context.purchaseOrder, context.deliveryEvidence, context.invoice],
      normalizeReference,
    ),
  (context) =>
    agreementRule(
      "V004",
      "Currency",
      "currency",
      [context.purchaseOrder, context.invoice],
      normalizeCurrency,
    ),
  (context) => {
    const poValue = stringField(context.purchaseOrder, "order_total");
    const invoiceValue = stringField(context.invoice, "total");
    const po = decimalToMinorUnits(poValue);
    const invoice = decimalToMinorUnits(invoiceValue);
    const values = {
      "Purchase order total": poValue,
      "Invoice total": invoiceValue,
    };
    const sources = [context.purchaseOrder.id, context.invoice.id];
    if (po === null || invoice === null)
      return result(
        "V005",
        "Invoice versus order total",
        "review",
        "A usable order or invoice total is missing.",
        values,
        sources,
      );
    if (invoice === po)
      return result(
        "V005",
        "Invoice versus order total",
        "pass",
        "The invoice total equals the purchase order total.",
        values,
        sources,
      );
    if (invoice < po)
      return result(
        "V005",
        "Invoice versus order total",
        "review",
        "The invoice is below the order total and may represent a partial delivery.",
        values,
        sources,
      );
    return result(
      "V005",
      "Invoice versus order total",
      "fail",
      "The invoice total is greater than the purchase order total.",
      values,
      sources,
    );
  },
  (context) => {
    const subtotalValue = stringField(context.invoice, "subtotal");
    const taxValue = stringField(context.invoice, "tax");
    const totalValue = stringField(context.invoice, "total");
    const subtotal = decimalToMinorUnits(subtotalValue);
    const tax = decimalToMinorUnits(taxValue);
    const total = decimalToMinorUnits(totalValue);
    const values = {
      "Invoice subtotal": subtotalValue,
      "Invoice tax": taxValue,
      "Invoice total": totalValue,
    };
    if (subtotal === null || tax === null || total === null)
      return result(
        "V006",
        "Invoice arithmetic",
        "review",
        "A subtotal, tax, or total value is missing.",
        values,
        [context.invoice.id],
      );
    const difference =
      subtotal + tax > total
        ? subtotal + tax - total
        : total - (subtotal + tax);
    return difference <= BigInt(1)
      ? result(
          "V006",
          "Invoice arithmetic",
          "pass",
          "Subtotal plus tax agrees with the invoice total within one minor currency unit.",
          values,
          [context.invoice.id],
        )
      : result(
          "V006",
          "Invoice arithmetic",
          "fail",
          "Subtotal plus tax does not equal the invoice total.",
          values,
          [context.invoice.id],
        );
  },
  (context) => {
    const poValue = stringField(context.purchaseOrder, "issue_date");
    const deliveryValue = stringField(
      context.deliveryEvidence,
      "delivery_or_completion_date",
    );
    const invoiceValue = stringField(context.invoice, "issue_date");
    const po = normalizeIsoDate(poValue);
    const delivery = normalizeIsoDate(deliveryValue);
    const invoice = normalizeIsoDate(invoiceValue);
    const values = {
      "PO issue date": poValue,
      "Delivery date": deliveryValue,
      "Invoice issue date": invoiceValue,
    };
    const sources = [
      context.purchaseOrder.id,
      context.deliveryEvidence.id,
      context.invoice.id,
    ];
    if (!po || !delivery || !invoice)
      return result(
        "V007",
        "Purchase order timing",
        "review",
        "A required date is missing or invalid.",
        values,
        sources,
      );
    return po <= delivery && po <= invoice
      ? result(
          "V007",
          "Purchase order timing",
          "pass",
          "The purchase order predates delivery and invoicing.",
          values,
          sources,
        )
      : result(
          "V007",
          "Purchase order timing",
          "fail",
          "The purchase order date occurs after delivery or invoicing.",
          values,
          sources,
        );
  },
  (context) => {
    const deliveryValue = stringField(
      context.deliveryEvidence,
      "delivery_or_completion_date",
    );
    const invoiceValue = stringField(context.invoice, "issue_date");
    const delivery = normalizeIsoDate(deliveryValue);
    const invoice = normalizeIsoDate(invoiceValue);
    const values = {
      "Delivery date": deliveryValue,
      "Invoice issue date": invoiceValue,
    };
    const sources = [context.deliveryEvidence.id, context.invoice.id];
    if (!delivery || !invoice)
      return result(
        "V008",
        "Delivery versus invoice timing",
        "review",
        "A delivery or invoice date is missing or invalid.",
        values,
        sources,
      );
    return delivery <= invoice
      ? result(
          "V008",
          "Delivery versus invoice timing",
          "pass",
          "Delivery occurred on or before the invoice date.",
          values,
          sources,
        )
      : result(
          "V008",
          "Delivery versus invoice timing",
          "fail",
          "The invoice predates the recorded delivery.",
          values,
          sources,
        );
  },
  (context) =>
    result(
      "V009",
      "Exact document duplicate",
      context.duplicateFileHash ? "fail" : "pass",
      context.duplicateFileHash
        ? "An identical file was previously submitted by this supplier organization."
        : "No earlier identical file was found for this supplier organization.",
      { "Duplicate found": context.duplicateFileHash ? "Yes" : "No" },
      [
        context.purchaseOrder.id,
        context.deliveryEvidence.id,
        context.invoice.id,
      ],
    ),
  (context) =>
    result(
      "V010",
      "Invoice identity duplicate",
      context.duplicateInvoiceIdentity ? "fail" : "pass",
      context.duplicateInvoiceIdentity
        ? "This supplier has already submitted the same normalized invoice number."
        : "This invoice identity is unique for the supplier organization.",
      {
        "Invoice number": stringField(context.invoice, "invoice_number"),
        "Duplicate found": context.duplicateInvoiceIdentity ? "Yes" : "No",
      },
      [context.invoice.id],
    ),
  (context) => {
    const present =
      context.deliveryEvidence.fields.receiver_or_signature_present;
    return present === true
      ? result(
          "V011",
          "Delivery acknowledgement",
          "pass",
          "The delivery evidence includes a receiver or signature acknowledgement.",
          { "Receiver or signature present": "Yes" },
          [context.deliveryEvidence.id],
        )
      : result(
          "V011",
          "Delivery acknowledgement",
          "review",
          present === false
            ? "The delivery evidence does not show a receiver or signature."
            : "The delivery acknowledgement could not be determined.",
          { "Receiver or signature present": present === false ? "No" : null },
          [context.deliveryEvidence.id],
        );
  },
  (context) =>
    context.buyerConfirmation === "confirmed"
      ? result(
          "V012",
          "Customer confirmation",
          "pass",
          "The large customer has confirmed the receivable in ProofFlow.",
          { "Customer status": "Confirmed" },
          [],
        )
      : context.buyerConfirmation === "disputed"
        ? result(
            "V012",
            "Customer confirmation",
            "fail",
            "The large customer disputed one or more details of the receivable.",
            { "Customer status": "Disputed" },
            [],
          )
        : result(
            "V012",
            "Customer confirmation",
            "review",
            "Customer confirmation is still pending.",
            { "Customer status": "Pending" },
            [],
          ),
];

export function runVerificationRulesV1(context: VerificationContext) {
  return verificationRulesV1.map((rule) => rule(context));
}

export function calculateOverallResult(
  checks: readonly VerificationCheck[],
): VerificationStatus {
  if (checks.some((check) => check.status === "fail")) return "fail";
  if (checks.some((check) => check.status === "review")) return "review";
  return "pass";
}
