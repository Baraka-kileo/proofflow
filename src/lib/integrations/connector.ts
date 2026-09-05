import type {
  ExternalInvoice,
  ExternalPaymentStatus,
  ExternalPurchaseOrder,
  ExternalReceipt,
  ExternalSupplier,
} from "./evidence-v1";

export type SupplierLookup = { supplierId?: string; supplierName: string };
export type PurchaseOrderLookup = {
  purchaseOrderNumber: string;
  supplierId: string;
};
export type InvoiceLookup = {
  invoiceNumber: string;
  purchaseOrderNumber: string | null;
  supplierId: string;
};
export type ReceiptLookup = {
  purchaseOrderNumber: string;
  invoiceNumber: string | null;
};
export type PaymentLookup = { externalInvoiceId: string };
export type ConnectionTestResult = {
  ok: boolean;
  provider: "coupa";
  mode: "live";
  checkedAt: string;
  errorCode?: string;
};

export interface BuyerSystemConnector {
  testConnection(): Promise<ConnectionTestResult>;
  findSupplier(input: SupplierLookup): Promise<ExternalSupplier | null>;
  findPurchaseOrder(
    input: PurchaseOrderLookup,
  ): Promise<ExternalPurchaseOrder | null>;
  findInvoice(input: InvoiceLookup): Promise<ExternalInvoice | null>;
  findReceipts(input: ReceiptLookup): Promise<ExternalReceipt[]>;
  getPaymentStatus(input: PaymentLookup): Promise<ExternalPaymentStatus | null>;
}
