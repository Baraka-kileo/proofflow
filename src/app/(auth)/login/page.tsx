import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { LoginForm, type TestCredential } from "@/features/auth/login-form";
import { getServerEnvironment } from "@/lib/env/server";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  const environment = getServerEnvironment();
  const password = environment.PROOFFLOW_TEST_PASSWORD;
  const testCredentials: TestCredential[] = password && environment.PROOFFLOW_ENABLE_TEST_CREDENTIALS === "true" ? [
    {
      role: "sme",
      label: "SME",
      detail: "Create evidence",
      email: "sme.demo@proofflow.example",
      password,
      tone: "sme",
    },
    {
      role: "buyer",
      label: "Large customer",
      detail: "Confirm invoices",
      email: "buyer.demo@proofflow.example",
      password,
      tone: "customer",
    },
    {
      role: "funder",
      label: "Funder / Bank",
      detail: "Review applications",
      email: "funder.demo@proofflow.example",
      password,
      tone: "funder",
    },
  ] : [];
  return (
    <main className="login-layout">
      <section className="login-story">
        <Logo className="text-white" />
        <div className="max-w-xl">
          <span className="text-xs font-bold uppercase tracking-[.14em] text-[#9fd4c5]">
            From invoice to cash readiness
          </span>
          <h1 className="mt-5 text-5xl font-semibold leading-[.98] tracking-[-.06em] text-white sm:text-6xl">
            One trusted story for every side of the invoice.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-[#c7d9d3]">
            SMEs provide the evidence, large customers confirm the work, and
            funders or banks review one explainable package.
          </p>
        </div>
        <p className="text-xs text-[#9fd4c5]">
          Private evidence · Explainable checks · Role-based access
        </p>
      </section>
      <section className="login-panel">
        <div className="w-full max-w-xl">
          <span className="text-xs font-bold uppercase tracking-[.12em] text-[var(--primary)]">
            Welcome back
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-.045em]">
            Sign in to ProofFlow
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Use your hosted account. Sample credentials for testing appear below when enabled.
          </p>
          <div className="mt-8">
            <LoginForm testCredentials={testCredentials} />
          </div>
        </div>
      </section>
    </main>
  );
}
