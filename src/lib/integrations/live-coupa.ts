import type { BuyerSystemConnector,ConnectionTestResult,InvoiceLookup,PaymentLookup,PurchaseOrderLookup,ReceiptLookup,SupplierLookup } from "./connector";

/** Production boundary only. Activation requires an authorised Coupa sandbox and read-only OAuth credentials. */
export class LiveCoupaConnector implements BuyerSystemConnector {
  async testConnection():Promise<ConnectionTestResult>{return{ok:false,provider:"coupa",mode:"live",checkedAt:new Date().toISOString(),errorCode:"LIVE_COUPA_NOT_CONFIGURED"};}
  async findSupplier(input:SupplierLookup){void input;return null;}
  async findPurchaseOrder(input:PurchaseOrderLookup){void input;return null;}
  async findInvoice(input:InvoiceLookup){void input;return null;}
  async findReceipts(input:ReceiptLookup){void input;return [];}
  async getPaymentStatus(input:PaymentLookup){void input;return null;}
}
