import "server-only";

import { extractionV1Schema, type ExtractionV1 } from "@/lib/ai/extraction-v1";
import type { DocumentKind } from "@/lib/documents/validation";

export const DEMO_EXTRACTION_DISCLOSURE = "Demo extraction—not processed by live AI";

const field = (value: string | boolean, sourceLabel: string) => ({ value, confidenceBps: 10_000, sourceLabel });

const fixtures: Record<string, ExtractionV1> = {
  "6f85db7384e00c78129dc036f584c2db431be78ed482da59b67898fb1bd5ab20": extractionV1Schema.parse({
    schemaVersion: "extraction-v1", documentKind: "purchase_order", fields: {
      buyerLegalName: field("Ubuntu Retail Group Demo", "Buyer"), supplierLegalName: field("Ndlovu Office Supply Demo", "Supplier"),
      purchaseOrderReference: field("PO-DEMO-1042", "PO reference"), issueDate: field("2026-08-20", "Issue date"),
      currency: field("ZAR", "Currency"), orderTotal: field("48750.25", "Order total"),
    },
  }),
  "be862add95dea6ab0d1c74ed0015875eaa7e50f7efc05d329f580f6a02483dcf": extractionV1Schema.parse({
    schemaVersion: "extraction-v1", documentKind: "delivery_evidence", fields: {
      buyerLegalName: field("Ubuntu Retail Group Demo", "Delivered to"), supplierLegalName: field("Ndlovu Office Supply Demo", "Supplier"),
      purchaseOrderReference: field("PO-DEMO-1042", "PO reference"), deliveryOrCompletionDate: field("2026-08-22", "Completion date"),
      receiverOrSignaturePresent: field(true, "Receipt confirmation"),
    },
  }),
  "9b93af9c5eaf434b058ca50a30b8178dcfd1b097113f6999aef8a29b21855272": extractionV1Schema.parse({
    schemaVersion: "extraction-v1", documentKind: "invoice", fields: {
      buyerLegalName: field("Ubuntu Retail Group Demo", "Bill to"), supplierLegalName: field("Ndlovu Office Supply Demo", "Supplier"),
      invoiceNumber: field("INV-DEMO-1042", "Invoice number"), purchaseOrderReference: field("PO-DEMO-1042", "PO reference"),
      issueDate: field("2026-08-22", "Invoice date"), dueDate: field("2026-10-21", "Due date"), currency: field("ZAR", "Currency"),
      subtotal: field("42391.52", "Subtotal"), tax: field("6358.73", "VAT 15%"), total: field("48750.25", "Invoice total"),
    },
  }),
};

export class DemoExtractionError extends Error {
  constructor(public readonly code: "DEMO_MODE_DISABLED" | "DEMO_DOCUMENT_UNKNOWN") { super(code); this.name = "DemoExtractionError"; }
}

export function extractDemoDocument(input: { mode: "live" | "demo"; kind: DocumentKind; sha256: string }) {
  if (input.mode !== "demo") throw new DemoExtractionError("DEMO_MODE_DISABLED");
  const extraction = fixtures[input.sha256];
  if (!extraction || extraction.documentKind !== input.kind) throw new DemoExtractionError("DEMO_DOCUMENT_UNKNOWN");
  return {
    extraction,
    normalizedFields: Object.fromEntries(Object.entries(extraction.fields).map(([name, candidate]) => [name, typeof candidate.value === "string" ? candidate.value.trim() : candidate.value])),
    provider: "proofflow-demo-fixture" as const,
    model: "deterministic-fixture-v1",
    metadata: { disclosure: DEMO_EXTRACTION_DISCLOSURE, fixtureHash: input.sha256 },
  };
}
