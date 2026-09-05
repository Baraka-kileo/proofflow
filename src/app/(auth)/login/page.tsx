import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { LoginForm, type DemoCredential } from "@/features/auth/login-form";
import { getDemoAuthEnvironment } from "@/lib/env/server";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  const { PROOFFLOW_DEMO_PASSWORD: password } = getDemoAuthEnvironment();
  const demoCredentials: DemoCredential[] = [
    {
      role: "sme",
      label: "SME",
      detail: "Create evidence",
      email: "sme.demo@proofflow.example",
      password,
    },
    {
      role: "buyer",
      label: "Buyer",
      detail: "Confirm invoices",
      email: "buyer.demo@proofflow.example",
      password,
    },
    {
      role: "funder",
      label: "Funder",
      detail: "Review evidence",
      email: "funder.demo@proofflow.example",
      password,
    },
  ];
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
            SMEs provide the evidence, buyers confirm the work, and funders
            review one explainable package.
          </p>
        </div>
        <p className="text-xs text-[#9fd4c5]">
          Hackathon demonstration · Synthetic data · No real money moves
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
            Use your hosted account or choose a fictional demo role below.
          </p>
          <div className="mt-8">
            <LoginForm demoCredentials={demoCredentials} />
          </div>
        </div>
      </section>
    </main>
  );
}
