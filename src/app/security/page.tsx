import Link from "next/link";

export default function SecurityPage() {
  return (
    <main>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="ProofFlow home">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span>ProofFlow</span>
        </Link>
        <div className="site-actions"><Link className="button button-small button-primary" href="/login">Log in</Link></div>
      </header>
      <section className="workflow" aria-labelledby="security-title">
        <div className="section-heading">
          <span className="overline">Security and responsibility</span>
          <h1 id="security-title">Confidential evidence stays inside a controlled workflow.</h1>
          <p>ProofFlow is designed for private business documents, strict role boundaries and traceable decisions.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {[
            ["Private storage", "Documents are stored privately and opened with short-lived signed links."],
            ["Tenant isolation", "Authentication, organization membership and row-level security limit who can access each record."],
            ["Manual evidence handling", "Evidence is entered by the SME and checked with fixed, explainable consistency rules."],
            ["Auditability", "Submissions, confirmations, compliance-status updates and decisions retain actor and timestamp records."],
            ["External compliance boundary", "The selected funding partner or approved provider performs KYC/KYB. ProofFlow stores workflow status, not biometrics or confidential reports."],
            ["Independent funding", "ProofFlow does not approve credit, lend money, hold funds, set rates or guarantee repayment."],
          ].map(([title,copy]) => (
            <article key={title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
              <h2 className="text-lg font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{copy}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
