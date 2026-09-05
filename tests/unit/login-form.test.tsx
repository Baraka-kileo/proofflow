import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/features/auth/login-form";
import { loginSchema } from "@/lib/validation/login";

describe("login form", () => {
  afterEach(cleanup);
  it("validates fields and toggles password visibility", async () => {
    const action = vi.fn(
      async (
        _state: { errors: Array<{ id: string; message: string }> },
        formData: FormData,
      ) => {
        const parsed = loginSchema.safeParse({
          email: formData.get("email"),
          password: formData.get("password"),
        });
        return parsed.success
          ? { errors: [] }
          : {
              errors: parsed.error.issues.map((issue) => ({
                id: String(issue.path[0]),
                message: issue.message,
              })),
            };
      },
    );
    const user = userEvent.setup();
    render(<LoginForm action={action} />);
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Enter a valid email address",
    );
    const password = screen.getByLabelText(/^Password/);
    await user.type(password, "safe-sample-password");
    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");
  });
  it("shows a generic authentication error without revealing which credential failed", async () => {
    const action = vi.fn(async () => ({
      errors: [],
      message: "Email or password is incorrect.",
    }));
    const user = userEvent.setup();
    render(<LoginForm action={action} />);
    await user.type(
      screen.getByLabelText(/^Email address/),
      "sme.demo@proofflow.example",
    );
    await user.type(screen.getByLabelText(/^Password/), "safe-sample-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Email or password is incorrect",
    );
  });
  it("fills sample credentials but waits for the user to submit", async () => {
    const action = vi.fn(async () => ({ errors: [] }));
    const user = userEvent.setup();
    render(
      <LoginForm
        action={action}
        testCredentials={[
          {
            role: "buyer",
            label: "Large customer",
            detail: "Confirm invoices",
            tone: "customer",
            email: "buyer.demo@proofflow.example",
            password: "safe-sample-password",
          },
        ]}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: /Large customer.*Confirm invoices/ }),
    );
    expect(screen.getByLabelText(/^Email address/)).toHaveValue(
      "buyer.demo@proofflow.example",
    );
    expect(screen.getByLabelText(/^Password/)).toHaveValue(
      "safe-sample-password",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "credentials filled in",
    );
    expect(action).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(action).toHaveBeenCalledOnce();
  });
});
