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
    expect(screen.queryAllByTitle("Available in the next completed build unit")).toHaveLength(0);
    if(role==="sme"){
      expect(screen.getByRole("link",{name:"Applications"})).toHaveAttribute("href","/applications");
      expect(screen.getByRole("link",{name:"Trust Passport"})).toHaveAttribute("href","/trust-passport");
    }
    if(role==="buyer"){
      expect(screen.getByRole("link",{name:"Confirmations"})).toHaveAttribute("href","/confirmations");
      expect(screen.getByRole("link",{name:"History"})).toHaveAttribute("href","/confirmations/history");
    }
    if(role==="funder"){
      expect(screen.getByRole("link",{name:"Applications"})).toHaveAttribute("href","/applications");
      expect(screen.getByRole("link",{name:"Offers"})).toHaveAttribute("href","/offers");
    }
    expect(screen.getByRole("link",{name:"Help"})).toHaveAttribute("href","/help");
    expect(screen.getByRole("link",{name:"Account"})).toHaveAttribute("href","/account");
  });
});
