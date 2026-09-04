import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { LoginForm } from "@/features/auth/login-form";

describe("login form", () => {
  afterEach(cleanup);
  it("validates fields and toggles password visibility", async () => {
    const user=userEvent.setup(); render(<LoginForm />);
    await user.click(screen.getByRole("button",{name:"Sign in"}));
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a valid email address");
    const password=screen.getByLabelText(/^Password/);
    await user.type(password,"safe-demo-password");
    await user.click(screen.getByRole("button",{name:"Show password"}));
    expect(password).toHaveAttribute("type","text");
  });
  it("honestly blocks live sign-in until Supabase is connected", async () => {
    const user=userEvent.setup(); render(<LoginForm />);
    await user.type(screen.getByLabelText(/^Email address/),"demo@example.test");
    await user.type(screen.getByLabelText(/^Password/),"safe-demo-password");
    await user.click(screen.getByRole("button",{name:"Sign in"}));
    expect(screen.getByRole("status")).toHaveTextContent("Live sign-in is not connected yet");
  });
});
