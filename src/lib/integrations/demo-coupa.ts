import { canonicalEvidenceSchema, type CanonicalEvidence } from "./evidence-v1";
import type { BuyerSystemConnector, ConnectionTestResult, InvoiceLookup, PaymentLookup, PurchaseOrderLookup, ReceiptLookup, SupplierLookup } from "./connector";

export const demoCoupaScenarios = ["match", "invoice_missing", "amount_mismatch", "receipt_missing", "already_paid", "disconnected"] as const;
export type DemoCoupaScenario = (typeof demoCoupaScenarios)[number];

export type DemoTransaction = {
  supplierId: string;
  supplierName: string;
  purchaseOrderNumber: string;
  invoiceNumber: string;
  invoiceTotalMinor: number;
  currency: string;
  invoiceDate: string | null;
  dueDate: string | null;
};

export class DemoCoupaConnector implements BuyerSystemConnector {
  constructor(private readonly scenario: DemoCoupaScenario, private readonly transaction: DemoTransaction, private readonly now = () => new Date().toISOString()) {}

  async testConnection(): Promise<ConnectionTestResult> {
    return { ok: this.scenario !== "disconnected", provider: "coupa", mode: "demo", checkedAt: this.now(), ...(this.scenario === "disconnected" ? { errorCode: "COUPA_UNAVAILABLE" } : {}) };
  }

  async findSupplier(input: SupplierLookup) {
    void input;
    if (this.scenario === "disconnected") return null;
    return { externalId: this.transaction.supplierId, name: this.transaction.supplierName, taxIdentifier: null, status: "active" };
  }

  async findPurchaseOrder(input: PurchaseOrderLookup) {
    void input;
    if (this.scenario === "disconnected") return null;
    return { externalId: `COUPA-PO-${this.transaction.purchaseOrderNumber}`, purchaseOrderNumber: this.transaction.purchaseOrderNumber, supplierId: this.transaction.supplierId, currency: this.transaction.currency, totalMinor: this.transaction.invoiceTotalMinor, status: "issued", issuedOn: this.transaction.invoiceDate };
  }

  async findInvoice(input: InvoiceLookup) {
    void input;
    if (this.scenario === "disconnected" || this.scenario === "invoice_missing") return null;
    const totalMinor = this.scenario === "amount_mismatch" ? Math.max(0, this.transaction.invoiceTotalMinor - 250_000) : this.transaction.invoiceTotalMinor;
    const paid = this.scenario === "already_paid";
    return { externalId: `COUPA-INV-${this.transaction.invoiceNumber}`, invoiceNumber: this.transaction.invoiceNumber, purchaseOrderNumber: this.transaction.purchaseOrderNumber, supplierId: this.transaction.supplierId, supplierName: this.transaction.supplierName, totalMinor, outstandingMinor: paid ? 0 : totalMinor, currency: this.transaction.currency, status: paid ? "paid" : "approved", invoiceDate: this.transaction.invoiceDate, dueDate: this.transaction.dueDate };
  }

  async findReceipts(input: ReceiptLookup) {
    void input;
    if (["disconnected", "receipt_missing"].includes(this.scenario)) return [];
    return [{ externalId: `COUPA-REC-${this.transaction.purchaseOrderNumber}`, purchaseOrderNumber: this.transaction.purchaseOrderNumber, invoiceNumber: this.transaction.invoiceNumber, receivedOn: this.transaction.invoiceDate, status: "received" }];
  }

  async getPaymentStatus(input: PaymentLookup) {
    if (this.scenario === "disconnected" || this.scenario === "invoice_missing") return null;
    const paid = this.scenario === "already_paid";
    return { externalInvoiceId: input.externalInvoiceId, status: paid ? "paid" as const : "unpaid" as const, outstandingMinor: paid ? 0 : (this.scenario === "amount_mismatch" ? Math.max(0, this.transaction.invoiceTotalMinor - 250_000) : this.transaction.invoiceTotalMinor), expectedPaymentDate: this.transaction.dueDate };
  }
}

export async function retrieveDemoCoupaEvidence(connector: DemoCoupaConnector, transaction: DemoTransaction, correlationId: string): Promise<CanonicalEvidence | null> {
  const connection = await connector.testConnection();
  if (!connection.ok) return null;
  const supplier = await connector.findSupplier({ supplierName: transaction.supplierName, supplierId: transaction.supplierId });
  const purchaseOrder = supplier ? await connector.findPurchaseOrder({ purchaseOrderNumber: transaction.purchaseOrderNumber, supplierId: supplier.externalId }) : null;
  const invoice = supplier ? await connector.findInvoice({ invoiceNumber: transaction.invoiceNumber, purchaseOrderNumber: transaction.purchaseOrderNumber, supplierId: supplier.externalId }) : null;
  const [receipts, paymentStatus] = await Promise.all([
    connector.findReceipts({ purchaseOrderNumber: transaction.purchaseOrderNumber, invoiceNumber: transaction.invoiceNumber }),
    invoice ? connector.getPaymentStatus({ externalInvoiceId: invoice.externalId }) : Promise.resolve(null),
  ]);
  return canonicalEvidenceSchema.parse({ provider: "coupa", providerMode: "demo", supplier, purchaseOrder, invoice, receipts, serviceFulfilments: [], paymentStatus, retrievedAt: connection.checkedAt, correlationId });
}
