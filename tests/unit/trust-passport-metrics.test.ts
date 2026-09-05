import { describe, expect, it } from "vitest";
import { calculateTrustPassportMetrics, type PassportEvidenceInput } from "@/lib/trust-passport/metrics";

const base: PassportEvidenceInput = {
  applicationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  confirmationId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  confirmationStatus: "confirmed",
  decidedAt: "2026-09-05T10:00:00.000Z",
  buyerOrganizationId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  buyerName: "Ubuntu Retail Group Demo",
  invoiceNumber: "INV-001-DEMO",
  invoiceTotalMinor: 4_875_000,
  currency: "ZAR",
  verificationResult: "pass",
};

describe("Trust Passport metrics", () => {
  it("derives metrics only from completed confirmation evidence", () => {
    const result = calculateTrustPassportMetrics([
      base,
      { ...base, applicationId: "a2", confirmationId: "b2", invoiceTotalMinor: 2_000_000, verificationResult: "review" },
      { ...base, applicationId: "a3", confirmationId: "b3", confirmationStatus: "disputed", invoiceTotalMinor: 9_000_000 },
      { ...base, applicationId: "a4", confirmationId: "b4", invoiceTotalMinor: 1_000_000, verificationResult: "fail" },
      { ...base, applicationId: "a5", confirmationId: "b5", invoiceTotalMinor: 5_000_000, verificationResult: null },
    ]);

    expect(result.confirmedCount).toBe(4);
    expect(result.disputedCount).toBe(1);
    expect(result.distinctBuyerCount).toBe(1);
    expect(result.verifiedValueByCurrency).toEqual({ ZAR: 6_875_000 });
    expect(result.history).toHaveLength(5);
  });

  it("groups currencies without combining unlike values", () => {
    const result = calculateTrustPassportMetrics([
      base,
      { ...base, applicationId: "a2", confirmationId: "b2", currency: "USD", invoiceTotalMinor: 100_00 },
    ]);
    expect(result.verifiedValueByCurrency).toEqual({ ZAR: 4_875_000, USD: 100_00 });
  });

  it("returns an honest zero-history state", () => {
    expect(calculateTrustPassportMetrics([])).toEqual({
      confirmedCount: 0,
      disputedCount: 0,
      distinctBuyerCount: 0,
      verifiedValueByCurrency: {},
      history: [],
    });
  });
});
