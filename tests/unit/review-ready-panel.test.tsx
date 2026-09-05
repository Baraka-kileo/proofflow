import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReviewReadyPanel } from "@/features/applications/review-ready-panel";

describe("evidence entry ready panel", () => {
  it("explains manual evidence entry without external processing", () => {
    render(<ReviewReadyPanel />);
    expect(screen.getByText("Documents are ready for evidence entry")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enter evidence details" })).toBeInTheDocument();
    expect(screen.queryByText(/\bAI\b/i)).not.toBeInTheDocument();
  });
});
