export type PassportEvidenceInput = {
  applicationId: string;
  confirmationId: string;
  confirmationStatus: "confirmed" | "disputed";
  decidedAt: string;
  buyerOrganizationId: string;
  buyerName: string;
  invoiceNumber: string | null;
  invoiceTotalMinor: number | null;
  currency: string;
  verificationResult: "pass" | "review" | "fail" | null;
};

export type PassportHistoryItem = PassportEvidenceInput & {
  applicationHref: string;
  confirmationHref: string;
};

export type TrustPassportMetrics = {
  confirmedCount: number;
  disputedCount: number;
  distinctBuyerCount: number;
  verifiedValueByCurrency: Record<string, number>;
  history: PassportHistoryItem[];
};

export function calculateTrustPassportMetrics(rows: PassportEvidenceInput[]): TrustPassportMetrics {
  const completed = rows.filter(
    (row) =>
      (row.confirmationStatus === "confirmed" || row.confirmationStatus === "disputed") &&
      Number.isFinite(new Date(row.decidedAt).getTime()),
  );
  const confirmed = completed.filter((row) => row.confirmationStatus === "confirmed");
  const verifiedValueByCurrency: Record<string, number> = {};

  for (const row of confirmed) {
    if (!row.verificationResult || row.verificationResult === "fail" || row.invoiceTotalMinor === null) continue;
    verifiedValueByCurrency[row.currency] =
      (verifiedValueByCurrency[row.currency] ?? 0) + row.invoiceTotalMinor;
  }

  return {
    confirmedCount: confirmed.length,
    disputedCount: completed.filter((row) => row.confirmationStatus === "disputed").length,
    distinctBuyerCount: new Set(confirmed.map((row) => row.buyerOrganizationId)).size,
    verifiedValueByCurrency,
    history: completed
      .toSorted((left, right) => Date.parse(right.decidedAt) - Date.parse(left.decidedAt))
      .map((row) => ({
        ...row,
        applicationHref: `/applications/${row.applicationId}`,
        confirmationHref: `/confirmations/${row.confirmationId}`,
      })),
  };
}
