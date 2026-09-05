import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/features/auth/login-form";
import { loginSchema } from "@/lib/validation/login";

describe("login form", () => {
  afterEach(cleanup);
  it("validates fields and toggles password visibility", async () => {
    const action=vi.fn(async (_state: {errors:Array<{id:string;message:string}>}, formData:FormData) => {const parsed=loginSchema.safeParse({email:formData.get("email"),password:formData.get("password")});return parsed.success?{errors:[]}:{errors:parsed.error.issues.map(issue=>({id:String(issue.path[0]),message:issue.message}))};});
    const user=userEvent.setup(); render(<LoginForm action={action} />);
    await user.click(screen.getByRole("button",{name:"Sign in"}));
    expect(await screen.findByRole("alert")).toHaveTextContent("Enter a valid email address");
    const password=screen.getByLabelText(/^Password/);
    await user.type(password,"safe-demo-password");
    await user.click(screen.getByRole("button",{name:"Show password"}));
    expect(password).toHaveAttribute("type","text");
  });
  it("shows a generic authentication error without revealing which credential failed", async () => {
    const action=vi.fn(async () => ({errors:[],message:"Email or password is incorrect."}));
    const user=userEvent.setup(); render(<LoginForm action={action} />);
    await user.type(screen.getByLabelText(/^Email address/),"demo@example.test");
    await user.type(screen.getByLabelText(/^Password/),"safe-demo-password");
    await user.click(screen.getByRole("button",{name:"Sign in"}));
    expect(await screen.findByRole("status")).toHaveTextContent("Email or password is incorrect");
  });
});
