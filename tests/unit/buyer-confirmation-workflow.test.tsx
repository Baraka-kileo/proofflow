import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BuyerConfirmationWorkflow } from "@/features/confirmations/buyer-confirmation-workflow";

vi.mock("@/app/(protected)/confirmations/[confirmationId]/actions", () => ({
  submitBuyerConfirmation: async () => ({ status: "idle" }),
}));

const props = {
  confirmationId: "00000000-0000-4000-8000-000000000001",
  facts: {
    buyer: "Ubuntu Retail Group Demo",
    supplier: "Ndlovu Office Supply Demo",
    purchaseOrder: "PO-1042",
    invoice: "INV-1042",
    amount: "R 48,750",
    outstanding: "R 48,750",
    paymentDate: "30 September 2026",
  },
  representative: {
    name: "Buyer Demo User",
    company: "Ubuntu Retail Group Demo",
    email: "buyer.demo@proofflow.example",
    emailVerified: true,
  },
  deliveryPreviewUrl: null,
  warnings: 0,
  completed: null,
};

describe("buyer confirmation question paging", () => {
  it("shows one numbered question at a time and keeps the answer when going back", async () => {
    const user = userEvent.setup();
    render(<BuyerConfirmationWorkflow {...props} />);

    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Question 1 of 6" })).toHaveAttribute("aria-valuenow", "17");
    expect(screen.getByText("Did your company issue this Purchase Order?")).toBeInTheDocument();
    expect(screen.queryByText("Were the goods/services delivered and accepted?")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next question" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Yes" }));
    await user.click(screen.getByRole("button", { name: "Next question" }));
    expect(screen.getByRole("progressbar", { name: "Question 2 of 6" })).toBeInTheDocument();
    expect(screen.getByText("Were the goods/services delivered and accepted?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("progressbar", { name: "Question 1 of 6" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Yes" })).toHaveAttribute("aria-pressed", "true");
  });
});
