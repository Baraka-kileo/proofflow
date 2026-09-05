import { z } from "zod";

const today = () => new Date().toISOString().slice(0, 10);

export const applicationDraftSchema = z.object({
  buyerOrganizationId: z.uuid("Choose a valid large customer organization."),
  purchaseOrderReference: z
    .string()
    .trim()
    .min(3, "Enter the purchase-order reference.")
    .max(80, "Purchase-order reference must be 80 characters or fewer."),
  invoiceNumber: z
    .string()
    .trim()
    .min(3, "Enter the invoice number.")
    .max(80, "Invoice number must be 80 characters or fewer."),
  invoiceAmount: z
    .string()
    .trim()
    .regex(
      /^\d+(?:\.\d{1,2})?$/,
      "Enter an amount with no more than two decimal places.",
    )
    .refine(
      (value) => Number(value) > 0,
      "Invoice amount must be greater than zero.",
    )
    .refine(
      (value) => Number(value) <= 100_000_000,
      "Invoice amount is above the supported limit.",
    ),
  currency: z.literal("ZAR", { error: "Choose South African rand (ZAR)." }),
  expectedDueDate: z.iso
    .date("Enter a valid expected due date.")
    .refine(
      (value) => value >= today(),
      "Expected due date cannot be in the past.",
    ),
});

export type ApplicationDraftState = {
  errors: Array<{ id: string; message: string }>;
  message?: string;
};

export function moneyToMinorUnits(value: string) {
  const [whole, fraction = ""] = value.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}
