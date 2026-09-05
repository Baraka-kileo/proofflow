import { z } from "zod";

const isoDate = z.string().date();
const optionalDate = isoDate.nullable();

export const externalSupplierSchema = z
  .object({
    externalId: z.string().min(1),
    name: z.string().min(1),
    taxIdentifier: z.string().min(1).nullable(),
    status: z.string().min(1),
  })
  .strict();

export const externalPurchaseOrderSchema = z
  .object({
    externalId: z.string().min(1),
    purchaseOrderNumber: z.string().min(1),
    supplierId: z.string().min(1),
    currency: z.string().length(3),
    totalMinor: z.number().int().nonnegative(),
    status: z.string().min(1),
    issuedOn: optionalDate,
  })
  .strict();

export const externalInvoiceSchema = z
  .object({
    externalId: z.string().min(1),
    invoiceNumber: z.string().min(1),
    purchaseOrderNumber: z.string().min(1).nullable(),
    supplierId: z.string().min(1),
    supplierName: z.string().min(1),
    totalMinor: z.number().int().nonnegative(),
    outstandingMinor: z.number().int().nonnegative().nullable(),
    currency: z.string().length(3),
    status: z.string().min(1),
    invoiceDate: optionalDate,
    dueDate: optionalDate,
  })
  .strict();

export const externalReceiptSchema = z
  .object({
    externalId: z.string().min(1),
    purchaseOrderNumber: z.string().min(1),
    invoiceNumber: z.string().min(1).nullable(),
    receivedOn: optionalDate,
    status: z.string().min(1),
  })
  .strict();

export const externalServiceFulfilmentSchema = z
  .object({
    externalId: z.string().min(1),
    purchaseOrderNumber: z.string().min(1),
    acceptedOn: optionalDate,
    status: z.string().min(1),
  })
  .strict();

export const externalPaymentStatusSchema = z
  .object({
    externalInvoiceId: z.string().min(1),
    status: z.enum(["unpaid", "partially_paid", "paid", "unknown"]),
    outstandingMinor: z.number().int().nonnegative().nullable(),
    expectedPaymentDate: optionalDate,
  })
  .strict();

export const canonicalEvidenceSchema = z
  .object({
    provider: z.literal("coupa"),
    providerMode: z.literal("live"),
    supplier: externalSupplierSchema.nullable(),
    purchaseOrder: externalPurchaseOrderSchema.nullable(),
    invoice: externalInvoiceSchema.nullable(),
    receipts: z.array(externalReceiptSchema),
    serviceFulfilments: z.array(externalServiceFulfilmentSchema),
    paymentStatus: externalPaymentStatusSchema.nullable(),
    retrievedAt: z.string().datetime({ offset: true }),
    correlationId: z.string().min(8),
  })
  .strict();

export type ExternalSupplier = z.infer<typeof externalSupplierSchema>;
export type ExternalPurchaseOrder = z.infer<typeof externalPurchaseOrderSchema>;
export type ExternalInvoice = z.infer<typeof externalInvoiceSchema>;
export type ExternalReceipt = z.infer<typeof externalReceiptSchema>;
export type ExternalServiceFulfilment = z.infer<
  typeof externalServiceFulfilmentSchema
>;
export type ExternalPaymentStatus = z.infer<typeof externalPaymentStatusSchema>;
export type CanonicalEvidence = z.infer<typeof canonicalEvidenceSchema>;
