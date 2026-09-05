import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";

const Arrow = () => (
  <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="none">
    <path d="M4 10h12m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Check = () => (
  <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="none">
    <path d="m5 10 3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const steps = [
  ["01", "SME submits evidence", "Upload the purchase order, delivery evidence and invoice, then enter the transaction details."],
  ["02", "ProofFlow checks consistency", "Fixed, explainable rules compare parties, references, dates and totals. Evidence verified is not funding approved."],
  ["03", "Large customer confirms", "Authorised customer records are checked where available, with authenticated confirmation as the fallback."],
  ["04", "Funder decides", "The funding partner completes KYC/KYB, credit assessment, pricing and underwriting before making an independent decision."],
];

const plans = [
  {
    name: "SME access",
    price: "Free",
    audience: "For SMEs",
    copy: "Build and submit trustworthy evidence without an upfront platform charge.",
    features: ["Document submission", "Manual evidence entry", "Deterministic verification", "Customer confirmation", "Funding application", "Basic Trust Passport"],
    cta: "Get started as an SME",
    href: "/login",
  },
  {
    name: "Customer confirmation",
    price: "Free",
    audience: "For large customers",
    copy: "Confirm or dispute supplier transactions through a controlled, traceable process.",
    features: ["Assigned confirmation requests", "Six transaction questions", "Dispute explanations", "Representative declaration", "Captured signature", "Confirmation certificate"],
    cta: "Open customer workspace",
    href: "/login",
  },
  {
    name: "Funding Partner",
    price: "5% success fee",
    audience: "For funders",
    copy: "Pay only when an opportunity introduced through ProofFlow is successfully funded.",
    features: ["Evidence-ready opportunities", "Customer-confirmed invoices", "External compliance status", "Independent proposal workflow", "No successful funding, no fee", "Maximum R1,000 per funded invoice"],
    cta: "Become a funding partner",
    href: "/contact?for=funder",
  },
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="ProofFlow home">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span>ProofFlow</span>
        </Link>
        <nav aria-label="Primary navigation">
          <a href="#workflow">How it works</a>
          <a href="#boundaries">Trust</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <div className="site-actions">
          <Link className="button button-small button-quiet" href="/security">Security</Link>
          <Link className="button button-small button-primary" href="/login">Log in</Link>
        </div>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy reveal">
          <div className="eyebrow"><span className="eyebrow-dot" /> Working capital starts with trusted evidence</div>
          <h1 id="hero-title">Turn completed work into <em>funding-ready proof.</em></h1>
          <p className="hero-lead">
            ProofFlow turns invoices, delivery records and customer confirmation
            into one structured, traceable package a funder can review.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/login">Get started as an SME <Arrow /></Link>
            <a className="button button-quiet" href="#pricing">See how ProofFlow earns revenue</a>
          </div>
        </div>
        <div className="proof-card reveal reveal-delay" aria-label="Preview of a funding-ready application">
          <div className="proof-card-top">
            <div><span className="overline">Application PF-2048</span><h2>Invoice evidence</h2></div>
            <StatusBadge status="success">Customer confirmed</StatusBadge>
          </div>
          <div className="amount-row">
            <div><span>Invoice value</span><strong>R 48,750.00</strong></div>
            <div><span>Payment due</span><strong>28 Oct 2026</strong></div>
          </div>
          <div className="evidence-list">
            {[
              ["PO", "Purchase order", "PO-8841 · consistent"],
              ["DN", "Delivery evidence", "Signed 01 Sep · consistent"],
              ["IN", "Invoice", "INV-2039 · no duplicate"],
            ].map(([icon,title,detail]) => (
              <div key={icon}><span className="doc-icon">{icon}</span><span><b>{title}</b><small>{detail}</small></span><i><Check /></i></div>
            ))}
          </div>
          <div className="trust-note">
            <span className="trust-icon">✦</span>
            <p><b>Clear decision boundaries</b><br />ProofFlow verifies transaction evidence. The funder owns compliance, underwriting and the funding decision.</p>
          </div>
        </div>
      </section>

      <section className="proof-strip" aria-label="Product principles">
        <span>Private documents</span><span>Manual evidence entry</span><span>Explainable checks</span><span>Customer-confirmed evidence</span>
      </section>

      <section className="workflow" id="problem" aria-labelledby="problem-title">
        <div className="section-heading">
          <span className="overline">The problem</span>
          <h2 id="problem-title">Good work can still be difficult to finance.</h2>
          <p>SMEs may finish legitimate work and issue a valid invoice, yet proving the order, delivery and customer obligation remains fragmented across documents, inboxes and business systems.</p>
        </div>
      </section>

      <section className="workflow" id="workflow" aria-labelledby="workflow-title">
        <div className="section-heading">
          <span className="overline">One accountable journey</span>
          <h2 id="workflow-title">From private evidence to an independent funding decision.</h2>
          <p>Each party does the work it is authorised and qualified to do. Every important action remains traceable.</p>
        </div>
        <ol className="step-grid">
          {steps.map(([number,title,copy]) => <li key={number}><span className="step-number">{number}</span><h3>{title}</h3><p>{copy}</p></li>)}
        </ol>
      </section>

      <section className="why" id="boundaries" aria-labelledby="boundaries-title">
        <div><span className="overline light">Trust through clear responsibility</span><h2 id="boundaries-title">Evidence verified is not funding approved.</h2></div>
        <div className="space-y-4">
          <p><b>ProofFlow verifies:</b> document completeness, matching parties and references, dates, totals, duplicates, delivery evidence and customer confirmation.</p>
          <p><b>The funder decides:</b> KYC/KYB, AML and sanctions checks, legal eligibility, credit risk, pricing, underwriting, approval and disbursement.</p>
          <p>ProofFlow does not lend, hold funds, set financing rates or guarantee repayment.</p>
        </div>
      </section>

      <section className="workflow" id="pricing" aria-labelledby="pricing-title">
        <div className="section-heading">
          <span className="overline">Business model</span>
          <h2 id="pricing-title">Free to participate. We earn only when funding succeeds.</h2>
          <p>SMEs and large customers use the evidence journey without a platform charge. The funding partner pays ProofFlow 5% of the financing fee it actually collects on a successfully funded opportunity.</p>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.name} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-[.12em] text-[var(--primary)]">{plan.audience}</span>
              <h3 className="mt-3 text-2xl font-bold">{plan.name}</h3>
              <p className="mt-1 text-lg font-bold text-[var(--primary)]">{plan.price}</p>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{plan.copy}</p>
              <ul className="mt-5 space-y-2 text-sm">{plan.features.map((feature) => <li key={feature} className="flex gap-2"><Check /> {feature}</li>)}</ul>
              <Link className="button button-primary mt-6" href={plan.href}>{plan.cta} <Arrow /></Link>
            </article>
          ))}
        </div>
        <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--soft)] p-5 text-sm leading-6">
          <p className="font-bold text-[var(--ink)]">Example: a R100,000 invoice</p>
          <p className="mt-1 text-[var(--muted)]">If the funder collects a R3,000 financing fee, ProofFlow receives R150. If funding does not complete, ProofFlow receives R0. The success fee is capped at R1,000 per funded invoice.</p>
        </div>
        <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
          The 5% applies only to the funder&apos;s collected financing fee—not the invoice value, the funding capital or the SME&apos;s advance. The funding partner retains responsibility for risk, compliance, underwriting, contracting, collections and disbursement. Commercial terms remain subject to partner, legal, tax and regulatory review.
        </p>
      </section>

      <footer>
        <Link className="brand" href="/"><span className="brand-mark" aria-hidden="true"><span /></span><span>ProofFlow</span></Link>
        <p>Structured evidence. Clear responsibility. Faster review.</p>
      </footer>
    </main>
  );
}
