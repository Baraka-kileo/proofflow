import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
afterEach(cleanup);
vi.mock(
  "@/app/(protected)/applications/[applicationId]/system-evidence/actions",
  () => ({ resolveCoupaException: vi.fn() }),
);
import { BuyerSystemEvidence } from "@/features/integrations/buyer-system-evidence";
import { ExceptionReviewForm } from "@/features/integrations/exception-review-form";
const checks = [
  {
    id: "1",
    code: "C007",
    result: "review" as const,
    title: "Amount and currency",
    explanation: "Amount mismatch — buyer review required.",
  },
];
describe("buyer-system evidence UI", () => {
  it("summarises customer-system verification and offers a certificate only after verification", () => {
    render(
      <BuyerSystemEvidence
        applicationId="00000000-0000-4000-8000-000000000001"
        outcome="system_verified"
        checkedAt="2026-09-05T12:32:00+02:00"
        checks={checks.map((check) => ({ ...check, result: "pass" as const }))}
        viewer="funder"
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Customer-system verification complete" }),
    ).toBeInTheDocument();
    expect(screen.getByText("customer system")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Verification certificate" }),
    ).toHaveAttribute(
      "href",
      "/applications/00000000-0000-4000-8000-000000000001/system-certificate",
    );
  });
  it("keeps exception actions short and explicit", () => {
    render(
      <ExceptionReviewForm
        applicationId="00000000-0000-4000-8000-000000000001"
        checkId="00000000-0000-4000-8000-000000000002"
      />,
    );
    expect(
      screen.getByRole("button", { name: "Confirm customer-system value" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Confirm supplier value" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Report another issue" }),
    ).toBeEnabled();
    expect(screen.getByLabelText("Another issue")).toBeRequired();
  });
  it("does not offer a certificate for unresolved review evidence", () => {
    render(
      <BuyerSystemEvidence
        applicationId="00000000-0000-4000-8000-000000000001"
        outcome="review_required"
        checkedAt="2026-09-05T12:32:00+02:00"
        checks={checks}
        viewer="buyer"
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Large customer review needed" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Verification certificate" }),
    ).not.toBeInTheDocument();
  });
});
