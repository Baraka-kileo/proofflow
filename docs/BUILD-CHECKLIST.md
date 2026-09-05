# ProofFlow submission checklist

This checklist describes the current submission. Earlier phase checklists are preserved only in the implementation log.

## Working protocol

Before changing a checklist item, confirm its dependencies and acceptance evidence. Work on the first incomplete **MUST** item that is not blocked. At the end of the unit, run the relevant quality gate and append the exact result to [IMPLEMENTATION-LOG.md](IMPLEMENTATION-LOG.md). Check an item only when every acceptance check passes; otherwise leave it unchecked and record what remains. The hackathon MVP is complete only when every checked submission item still has current evidence and all intentionally incomplete pilot requirements remain clearly separated below.

## Product and user experience

- [x] One application with separate SME, large-customer and funder portal views
- [x] Clear problem, solution, commercial model and responsibility boundary on the landing page
- [x] Login-only sample credentials that fill the form without signing in automatically
- [x] Responsive layouts, visible focus, keyboard operation and reduced-motion support
- [x] Loading, empty, error, success and disabled states on important routes
- [x] No enabled control that fabricates an integration, approval or money movement

## SME evidence workflow

- [x] Application creation with customer, invoice and requested-funding details
- [x] Three private document slots: purchase order, delivery evidence and invoice
- [x] Complete 21-field manual evidence entry with an SME declaration
- [x] Atomic server/database submission: all required evidence saves or none does
- [x] Twelve transparent checks with compared values and plain explanations
- [x] Exact-file and invoice-identity duplicate detection
- [x] Customer-confirmation handoff and status
- [x] Funding proposal response and evidence-based Trust Passport

## Large-customer workflow

- [x] Assigned confirmation queue and read-only decision history
- [x] Six transaction questions with explanations required for disputes
- [x] Review, representative details, captured signature and versioned declaration
- [x] Immutable confirmation receipt
- [x] Authorized view/download route for the customer confirmation certificate

## Funder / Bank workflow

- [x] Read-only access to eligible customer-evidenced packages
- [x] Evidence results, customer decision, certificate and audit timeline
- [x] External KYC/KYB status with limited provider/reference metadata
- [x] Explicit warning not to enter identity numbers, biometrics or screening reports
- [x] Independent proposal/decline with transparent advance and fee calculation
- [x] Acceptance stops at partner confirmation; ProofFlow does not claim disbursement

## Security and data privacy

- [x] Server-side identity, membership and role checks
- [x] Supabase Row Level Security for tenant isolation
- [x] Private storage and short-lived signed previews
- [x] MIME, file-size, PDF-page-count and SHA-256 validation
- [x] Generic authentication failure messages
- [x] AI processing removed from the evidence path
- [x] External integrations fail closed
- [x] Threat model, prohibited-data boundary and production gaps documented

## Submission evidence

- [x] Judge-first README with live link, architecture, business model and limitations
- [x] Dedicated guide mapping all six judging categories to inspectable evidence
- [x] Current screenshots for public, SME, customer, funder, checks and certificate views
- [x] Sample documents for testing clearly separated from live claims
- [x] Documentation index and current architecture source of truth
- [x] Contribution and private vulnerability-reporting guidance
- [x] GitHub description, topics and live homepage configured

## Quality gate

- [x] ESLint
- [x] TypeScript strict checking
- [x] Unit and component tests
- [x] Chromium browser journeys
- [x] Production build
- [x] Production dependency audit
- [x] GitHub Actions CI
- [x] Hosted migrations and Vercel production deployment

## Required before a real institutional pilot

- [ ] Named enterprise customer and funding-partner owners
- [ ] Authorized sandbox credentials and signed webhook contracts
- [ ] Independent penetration test and remediation
- [ ] Privacy/legal review, DPIA and data-processing agreements
- [ ] Malware scanning, rate limits, production monitoring and alerting
- [ ] Tested backup, recovery, retention, deletion and incident-response procedures
- [ ] Formal accessibility audit and support operating model

Unchecked pilot items are deliberately not presented as completed hackathon features. See [SECURITY.md](SECURITY.md) and [ROADMAP.md](ROADMAP.md).
