import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("public landing page", () => {
  it("communicates the product, responsibility and business model", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1, name: /Turn completed work into funding-ready proof/i })).toBeInTheDocument();
    expect(screen.getByText("Evidence verified is not funding approved.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Core" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Connect" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Funding Partner" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Get started as an SME/ })[0]).toHaveAttribute("href", "/login");
  });
});
