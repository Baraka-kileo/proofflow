import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Navigation } from "@/components/navigation";

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard" }));

describe("role-aware navigation", () => {
  afterEach(() => cleanup());
  it.each([
    ["sme", ["Overview", "Applications", "Trust Passport", "Help", "Account"]],
    ["buyer", ["Overview", "Confirmations", "History", "Help", "Account"]],
    ["funder", ["Overview", "Applications", "Offers", "Help", "Account"]],
  ] as const)("shows the correct %s destinations", (role, labels) => {
    render(<Navigation role={role} />);
    for (const label of labels) expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
    expect(screen.getAllByTitle("Available in the next completed build unit")).toHaveLength(4);
  });
});
