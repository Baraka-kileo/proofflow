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
  ["01", "Upload the evidence", "Add the purchase order, delivery proof, and invoice in three guided slots."],
  ["02", "Check every detail", "AI extracts the facts. Explainable rules compare references, parties, dates, and totals."],
  ["03", "Get buyer confirmation", "The buyer confirms delivery in their own secure portal—no unreliable email demo required."],
  ["04", "Review a clear offer", "A funder sees one trusted evidence pack and can create a transparent simulated offer."],
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
          <a href="#why">Why ProofFlow</a>
        </nav>
        <a className="button button-small button-quiet" href="https://github.com/Baraka-kileo/proofflow" target="_blank" rel="noreferrer">
          View build <Arrow />
        </a>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy reveal">
          <div className="eyebrow"><span className="eyebrow-dot" /> Built for SMEs waiting to be paid</div>
          <h1 id="hero-title">Turn completed work into <em>trusted proof.</em></h1>
          <p className="hero-lead">ProofFlow brings invoices, delivery evidence, and buyer confirmation into one funder-ready package—so a good business spends less time proving what already happened.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#workflow">Explore the flow <Arrow /></a>
            <span className="microcopy">Hackathon demo · no real money moves</span>
          </div>
        </div>

        <div className="proof-card reveal reveal-delay" aria-label="Preview of a verified application">
          <div className="proof-card-top">
            <div>
              <span className="overline">Application PF-2048</span>
              <h2>Invoice evidence</h2>
            </div>
            <StatusBadge status="success">Buyer confirmed</StatusBadge>
          </div>
          <div className="amount-row">
            <div><span>Invoice value</span><strong>R 48,750.00</strong></div>
            <div><span>Payment due</span><strong>28 Oct 2026</strong></div>
          </div>
          <div className="evidence-list">
            <div><span className="doc-icon">PO</span><span><b>Purchase order</b><small>PO-8841 · matched</small></span><i><Check /></i></div>
            <div><span className="doc-icon">DN</span><span><b>Delivery note</b><small>Signed 01 Sep · matched</small></span><i><Check /></i></div>
            <div><span className="doc-icon">IN</span><span><b>Invoice</b><small>INV-2039 · no duplicate</small></span><i><Check /></i></div>
          </div>
          <div className="timeline" aria-label="Application progress">
            <div className="timeline-label"><span>Evidence progress</span><b>3 of 4 complete</b></div>
            <div className="timeline-track"><span /></div>
            <div className="timeline-steps"><span>Uploaded</span><span>Checked</span><span>Confirmed</span><span>Offer</span></div>
          </div>
          <div className="trust-note"><span className="trust-icon">✦</span><p><b>Built for clarity</b><br />Every result shows what was compared and why it passed.</p></div>
        </div>
      </section>

      <section className="proof-strip" aria-label="Product principles">
        <span>Private documents</span><span>Explainable checks</span><span>Human-reviewed AI</span><span>Buyer-confirmed evidence</span>
      </section>

      <section className="workflow" id="workflow" aria-labelledby="workflow-title">
        <div className="section-heading">
          <span className="overline">One clear journey</span>
          <h2 id="workflow-title">From scattered documents<br />to a decision-ready story.</h2>
          <p>Each person sees only the work they need to do. The system keeps the evidence and the audit trail connected.</p>
        </div>
        <ol className="step-grid">
          {steps.map(([number, title, copy]) => (
            <li key={number}>
              <span className="step-number">{number}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="why" id="why" aria-labelledby="why-title">
        <div><span className="overline light">The honest promise</span><h2 id="why-title">We shorten the proof journey—not the truth.</h2></div>
        <p>ProofFlow does not guarantee finance or change the buyer&apos;s payment date. It helps a regulated funder assess a cleaner, buyer-confirmed package sooner. That is the bottleneck we are solving.</p>
      </section>

      <footer><Link className="brand" href="/"><span className="brand-mark" aria-hidden="true"><span /></span><span>ProofFlow</span></Link><p>ABSA Studentpreneur Hackathon 2026 · Synthetic data only</p></footer>
    </main>
  );
}
