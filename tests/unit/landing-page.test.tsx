import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "@/app/page";

describe("public landing page", () => {
  it("communicates the honest product promise and demo boundary", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Turn completed work into trusted proof.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Hackathon demo · no real money moves")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explore the flow" })).toHaveAttribute(
      "href",
      "#workflow",
    );
  });
});
