import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ApplicationTaskLayout } from "@/features/applications/application-task-layout";
import { deriveApplicationProgress } from "@/lib/applications/progress";

describe("application task layout", () => {
  afterEach(() => cleanup());
  it("shows the five server-derived steps and explains locked prerequisites", () => {
    render(
      <ApplicationTaskLayout
        {...deriveApplicationProgress({
          status: "draft",
          buyer_organization_id: "buyer",
          purchase_order_reference: "PO-42",
          invoice_number: "INV-42",
          invoice_total_minor: 4200,
          invoice_due_on: "2099-01-01",
        })}
      >
        <p>Current task</p>
      </ApplicationTaskLayout>,
    );
    const desktop = screen.getByRole("complementary", {
      name: "Application progress",
    });
    for (const label of [
      "Details",
      "Documents",
      "Review",
      "Document checks",
      "Automated verification",
    ])
      expect(
        within(desktop).getByText(label, { selector: "b" }),
      ).toBeInTheDocument();
    expect(
      within(desktop).getByText("Documents", { selector: "b" }).closest("li"),
    ).toHaveAttribute("aria-current", "step");
    expect(
      screen.getAllByText("Upload all three evidence documents first."),
    ).toHaveLength(2);
    expect(screen.getByText("Step 2 of 5")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "Application completion" }),
    ).toHaveAttribute("aria-valuenow", "1");
  });
});
