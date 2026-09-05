import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ErrorSummary } from "@/components/error-summary";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

describe("shared UI primitives", () => {
  it("keeps a loading button disabled and exposes its busy state", () => {
    render(<Button loading>Checking evidence</Button>);
    expect(screen.getByRole("button", { name: "Checking evidence" })).toBeDisabled();
    expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
  });

  it("invokes an enabled primary action", async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    render(<Button onClick={action}>Continue</Button>);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(action).toHaveBeenCalledOnce();
  });

  it("communicates progress and status without relying on colour", () => {
    render(<><Progress label="Document upload" value={72} /><StatusBadge status="review">Needs review</StatusBadge></>);
    expect(screen.getByRole("progressbar", { name: "Document upload" })).toHaveAttribute("aria-valuenow", "72");
    expect(screen.getByText("Needs review")).toBeInTheDocument();
  });

  it("links errors back to their fields", () => {
    render(<ErrorSummary errors={[{ id: "invoice-number", message: "Enter the invoice number" }]} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Enter the invoice number" })).toHaveAttribute("href", "#invoice-number");
  });

  it("traps dialog interaction and restores focus to its trigger", async () => {
    const user = userEvent.setup();
    render(<Dialog><DialogTrigger>Review decision</DialogTrigger><DialogContent title="Confirm decision"><button>Continue</button></DialogContent></Dialog>);
    const trigger = screen.getByRole("button", { name: "Review decision" });
    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Confirm decision" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(trigger).toHaveFocus();
  });
});
