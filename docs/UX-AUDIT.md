# ProofFlow experience audit

Audit date: 5 September 2026

## Current result

The public, SME, large-customer, and funder surfaces implement one production-style workflow. The application no longer offers an alternate mode or automated document extraction. Manual evidence entry, 12 transparent document checks, authenticated customer confirmation, external funder-owned compliance, and independent funding proposals are presented as separate responsibilities.

Automated verification completed for this implementation:

- ESLint passed.
- TypeScript type checking passed.
- 25 unit-test files passed with 124 assertions, including the external compliance responsibility and restricted-data warning.
- Five Chromium journeys passed, covering the landing page, partner onboarding, security boundaries, signed-out protection, and generic authentication errors.
- The production Next.js build passed with 16 generated pages, including landing, contact, and security.

## Route and state review

| Surface | Primary outcome | Boundary or recovery state |
|---|---|---|
| `/` | Explains the problem, evidence workflow, business model, and three participant roles | Does not imply that ProofFlow performs compliance, underwriting, or lending |
| `/login` | Creates an authenticated session | Optional testing credentials only fill the form and can be disabled |
| SME dashboard and applications | Creates applications, uploads evidence, enters values, runs checks, and tracks proposals | Incomplete evidence cannot advance; invalid submissions remain editable |
| Large-customer dashboard and confirmations | Confirms or disputes transaction facts | No authorized integration means manual authenticated confirmation, not a generated result |
| Funder dashboard and applications | Reviews funding-ready packages, records external compliance progress, and makes an independent proposal or decline | Compliance stays external; proposal acceptance does not claim disbursement |
| `/trust-passport` | Presents sourced transaction history and metrics | Explicitly not a credit score or funding guarantee |
| `/security` | Explains access, storage, audit, compliance, and funding boundaries | Does not claim certifications or controls that have not been independently verified |

## Security and trust review

- Private documents use controlled storage paths and short-lived signed URLs.
- Server authorization and database row-level security enforce role and tenant boundaries.
- Manual evidence submission validates the complete field set and persists it atomically.
- Immutable audit records retain actors, timestamps, decisions, and state transitions.
- External compliance records contain workflow metadata only.
- Integration failures remain unavailable or fall back to authenticated customer confirmation; they do not invent third-party evidence.
- Interactive funding actions stop at a proposal response until a real partner integration confirms money movement.
- A funding partner cannot overwrite another partner's compliance status for the same application.

## Responsive and accessibility baseline

The shared interface supplies route-specific loading, empty, error, success, permission, and disabled states where applicable. Layouts are designed for 390x844, 768x1024, and 1440x900 viewports without horizontal overflow. Focus styles, labelled controls, live feedback, 44px touch targets, reduced motion, and safe dialog focus are retained from the earlier accessibility pass.

## Deployment evidence

- The hosted database migrations through `20260905180000_fix_manual_evidence_initializer.sql` were applied successfully.
- The production deployment is available at [proofflow-sepia.vercel.app](https://proofflow-sepia.vercel.app).
- The public landing and security routes return successfully.
- The optional testing-credentials panel appears on the login page only and requires an explicit sign-in.
- Hosted authentication was exercised through to the SME dashboard.

## Remaining production-readiness work

- Configure real customer-system or funding-partner connections only after authorization and contract review.
- Complete independent security, privacy, legal, and accessibility reviews before onboarding real organizations.
- Validate production monitoring, backups, incident response, data retention, and recovery procedures.
- Complete a formal, repeatable acceptance rehearsal of every hosted role with named pilot owners.

Fictional seed records are development data only. They populate the normal architecture and must never be presented as real companies, external checks, approvals, or transfers.
