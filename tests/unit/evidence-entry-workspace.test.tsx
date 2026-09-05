import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EvidenceEntryWorkspace } from "@/features/applications/evidence-entry-workspace";

const documents = [{
  id: "po",
  kind: "purchase_order" as const,
  filename: "purchase-order.pdf",
  previewUrl: "https://example.test/signed-po",
  fields: [
    { id: "buyer", name: "buyer_legal_name", normalizedValue: null },
    { id: "date", name: "issue_date", normalizedValue: null },
  ],
}];

describe("evidence entry workspace", () => {
  it("shows a private source preview and manual fields", () => {
    render(<EvidenceEntryWorkspace documents={documents} />);
    expect(screen.getByText("Enter the evidence details")).toBeInTheDocument();
    expect(screen.getByLabelText("Large customer legal name")).toBeInTheDocument();
    expect(screen.getByTitle("Purchase order private preview")).toBeInTheDocument();
  });
});
