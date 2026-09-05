"use client";

import { Check, Eye, EyeOff } from "lucide-react";
import { useActionState, useState } from "react";
import { signIn, type LoginState } from "@/app/(auth)/login/actions";
import { ErrorSummary } from "@/components/error-summary";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

type LoginAction = (
  state: LoginState,
  formData: FormData,
) => Promise<LoginState>;
export type DemoCredential = {
  role: string;
  label: string;
  detail: string;
  email: string;
  password: string;
};
const initialLoginState: LoginState = { errors: [] };

export function LoginForm({
  action = signIn,
  demoCredentials = [],
}: {
  action?: LoginAction;
  demoCredentials?: DemoCredential[];
}) {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(
    action,
    initialLoginState,
  );
  const errors = state.errors;

  function fillDemoAccount(credential: DemoCredential) {
    setEmail(credential.email);
    setPassword(credential.password);
    setSelectedRole(credential.role);
    document.getElementById("email")?.focus();
  }

  return (
    <div>
      {demoCredentials.length > 0 && (
        <section aria-labelledby="demo-account-heading" className="mb-7">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h3 id="demo-account-heading" className="font-bold">
                Choose a demo account
              </h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                This fills the test credentials. Review them, then press Sign
                in.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-[var(--review-soft)] px-2.5 py-1 text-xs font-bold text-[var(--review)]">
              Demo only
            </span>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {demoCredentials.map((credential) => (
              <button
                key={credential.role}
                type="button"
                aria-pressed={selectedRole === credential.role}
                onClick={() => fillDemoAccount(credential)}
                className="min-h-20 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-left transition-colors hover:bg-[var(--soft)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--focus)] aria-pressed:border-[var(--primary)] aria-pressed:bg-[var(--success-soft)]"
              >
                <span className="flex items-center justify-between gap-2 text-sm font-bold">
                  {credential.label}
                  {selectedRole === credential.role && (
                    <Check
                      aria-hidden="true"
                      className="size-4 text-[var(--primary)]"
                    />
                  )}
                </span>
                <span className="mt-1 block text-xs leading-4 text-[var(--muted)]">
                  {credential.detail}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
      <form action={formAction} noValidate className="space-y-5">
        <ErrorSummary errors={errors} />
        {state.message && (
          <Alert title="Sign-in unsuccessful">{state.message}</Alert>
        )}
        {selectedRole && (
          <p
            role="status"
            className="rounded-xl bg-[var(--success-soft)] px-3 py-2 text-sm font-semibold text-[var(--primary)]"
          >
            {
              demoCredentials.find(
                (credential) => credential.role === selectedRole,
              )?.label
            }{" "}
            credentials filled in.
          </p>
        )}
        <FormField
          id="email"
          label="Email address"
          required
          error={errors.find((error) => error.id === "email")?.message}
        >
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setSelectedRole(null);
            }}
            aria-invalid={errors.some((error) => error.id === "email")}
          />
        </FormField>
        <FormField
          id="password"
          label="Password"
          required
          error={errors.find((error) => error.id === "password")?.message}
        >
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setSelectedRole(null);
              }}
              className="pr-12"
              aria-invalid={errors.some((error) => error.id === "password")}
            />
            <button
              type="button"
              onClick={() => setShow((value) => !value)}
              className="absolute right-1 top-1 grid size-10 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--soft)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[var(--focus)]"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? (
                <EyeOff aria-hidden="true" className="size-4" />
              ) : (
                <Eye aria-hidden="true" className="size-4" />
              )}
            </button>
          </div>
        </FormField>
        <Button className="w-full" type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
