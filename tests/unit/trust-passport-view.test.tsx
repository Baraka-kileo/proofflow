import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TrustPassportView } from "@/features/trust-passport/trust-passport-view";

describe("Trust Passport view", () => {
  afterEach(() => cleanup());

  it("explains the zero-history state without inventing a score", () => {
    render(
      <TrustPassportView
        organization="Empty Supplier Fixture"
        data={{ confirmedCount: 0, disputedCount: 0, distinctBuyerCount: 0, verifiedValueByCurrency: {}, history: [] }}
      />,
    );
    expect(screen.getByText("This is not a credit score or funding guarantee.", { exact: false })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "No completed customer evidence yet" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start an application" })).toHaveAttribute("href", "/applications/new");
  });

  it("links every completed event to its source records", () => {
    render(
      <TrustPassportView
        organization="Ndlovu Office Supplies"
        data={{
          confirmedCount: 1,
          disputedCount: 0,
          distinctBuyerCount: 1,
          verifiedValueByCurrency: { ZAR: 2_240_000 },
          history: [
            {
              applicationId: "application-1",
              confirmationId: "confirmation-1",
              confirmationStatus: "confirmed",
              decidedAt: "2026-09-05T04:43:00.000Z",
              buyerOrganizationId: "buyer-1",
              buyerName: "Ubuntu Retail Group",
              invoiceNumber: "INV-2040-DEMO",
              invoiceTotalMinor: 2_240_000,
              currency: "ZAR",
              verificationResult: "pass",
              applicationHref: "/applications/application-1",
              confirmationHref: "/confirmations/confirmation-1",
            },
          ],
        }}
      />,
    );
    expect(screen.getByText("R 22 400")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View application" })).toHaveAttribute("href", "/applications/application-1");
    expect(screen.getByRole("link", { name: "View customer receipt" })).toHaveAttribute("href", "/confirmations/confirmation-1");
  });
});
