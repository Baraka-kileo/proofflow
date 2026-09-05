import Link from "next/link";

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ for?: string }>;
}) {
  const audience = (await searchParams).for === "funder" ? "funding partner" : "large customer";

  return (
    <main>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="ProofFlow home">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span>ProofFlow</span>
        </Link>
        <div className="site-actions">
          <Link className="button button-small button-primary" href="/login">Log in</Link>
        </div>
      </header>
      <section className="workflow" aria-labelledby="contact-title">
        <div className="section-heading">
          <span className="overline">Partner onboarding</span>
          <h1 id="contact-title">Start a {audience} conversation.</h1>
          <p>
            ProofFlow onboards organizations directly so access, data permissions,
            commercial terms, and integration responsibilities can be agreed before
            any confidential information is shared.
          </p>
        </div>
        <div className="max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-xl font-bold">Already invited?</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Use the organization credentials issued during onboarding. Public
            large-customer and funder registration is intentionally unavailable.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link className="button button-primary" href="/login">Sign in</Link>
            <Link className="button button-quiet" href="/#pricing">Review partner options</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
