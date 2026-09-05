# ProofFlow judging guide

This page maps the published judging criteria directly to evidence in the working application and repository. The live submission is [proofflow-sepia.vercel.app](https://proofflow-sepia.vercel.app).

## At a glance

| Criterion | Weight | ProofFlow evidence |
|---|---:|---|
| Innovation and Creativity | 20 | Multi-party evidence lineage; deterministic, explainable checks; privacy-minimising KYC/KYB boundary |
| Technical Implementation | 20 | One role-based Next.js application; server authorisation; RLS; private storage; atomic evidence persistence; automated gates |
| Best Use of Tools | 15 | Tools selected for traceability and privacy; no AI processing of sensitive documents; fail-closed adapters |
| Security and Data Privacy | 15 | Threat model, tenant isolation, signed document access, validation, audit trail and explicit production gaps |
| Business Model | 15 | Free core trust workflow; paid enterprise automation; funding-partner platform economics; phased pilot assumptions |
| Scalability and Interoperability | 15 | Tenant-aware data model, role workspaces, versioned rules, provider-neutral status model and authorised adapter boundary |

## 1. Innovation and Creativity — 20 points

ProofFlow does not treat an uploaded invoice as sufficient proof and does not create another opaque risk score. It establishes a chain of evidence across independent participants: the SME declares facts, fixed rules expose agreement or mismatch, the customer confirms or disputes the transaction, and the funder retains responsibility for compliance and credit.

The privacy decision is part of the innovation: confidential financial documents are not sent to an AI processor, and raw KYC/KYB material stays with the regulated funder or approved provider.

**Evidence:** landing-page workflow at `/`; manual evidence interface in `src/features/applications/evidence-entry-workspace.tsx`; V001–V012 rules in `src/lib/integrations/rules-v1.ts`; customer journey in `src/features/dashboard/buyer-dashboard.tsx`; Trust Passport in `src/lib/trust-passport/`.

If validated with funders and enterprise buyers, ProofFlow can reduce repeated evidence requests, make exceptions visible earlier and give SMEs a reusable transaction history. The MVP demonstrates the workflow; it does not claim measured market impact yet.

## 2. Technical Implementation — 20 points

- Next.js 16 and React 19 deliver one application with public, SME, customer and funder views.
- Supabase Auth establishes identity; server checks establish membership and role.
- PostgreSQL and Row Level Security enforce organization boundaries beneath the UI.
- Private storage and expiring signed URLs protect supporting documents.
- Zod, database functions and constraints validate the complete 21-field payload and persist it atomically.
- Versioned TypeScript rules produce repeatable results and audit events.

The interface provides one primary action per stage, a five-step journey, clear locked prerequisites, error recovery, keyboard focus, reduced-motion support and responsive layouts. See [UX-SPEC.md](UX-SPEC.md), [UX-AUDIT.md](UX-AUDIT.md), `supabase/migrations/`, `tests/` and `.github/workflows/ci.yml`.

## 3. Best Use of Tools — 15 points

| Need | Tool choice | Ethical and technical reason |
|---|---|---|
| Full-stack product | Next.js + TypeScript | Shared types and server-side protected operations in one deployable application |
| Identity, relational data and policy | Supabase | Auth, Postgres, transactional functions, storage and Row Level Security work together |
| Evidence consistency | Deterministic rules | Financial evidence needs repeatable results and a reason a human can challenge |
| Payload validation | Zod + database constraints | Reject malformed or incomplete writes before state changes |
| UI primitives | Radix-based components | Accessible keyboard and focus behaviour for complex controls |
| Verification | Vitest, Testing Library and Playwright | Domain, interaction and browser-level coverage |
| Delivery | GitHub Actions + Vercel | Automated gates and a reviewable live build |

AI was deliberately removed from the evidence path. This is a data-minimisation decision made after considering confidentiality, explainability and accountability in a fintech workflow.

## 4. Security and Data Privacy — 15 points

The main threats considered are cross-tenant access, direct object access, public document exposure, unsafe uploads, partial or duplicate submissions, forged partner results, excessive identity-data collection, secret leakage and premature claims of payment.

Implemented protections include server-side role checks, database RLS, private storage, short-lived signed URLs, MIME/size/page validation, SHA-256 duplicate detection, atomic evidence submission, immutable audit context, generic authentication failures and fail-closed integrations.

The public security page explains these boundaries in plain language. [SECURITY.md](SECURITY.md) provides the full threat/control matrix and states the independent work required before production use.

## 5. Business Model — 15 points

- **Core — Free:** the crucial evidence workflow stays accessible to SMEs.
- **Connect — Contract:** enterprises pay for authorised ERP connectivity, automation, bulk workflows, APIs, reporting and multi-entity controls.
- **Funding Partner — Partner model:** funders pay for portfolio workflow and integrations; an agreement may include a share of the funder's collected financing fee after successful funding.

ProofFlow does not take a cut of invoice principal or the SME advance. Pricing, fee sharing and regulated responsibilities require contracting and legal review.

A six-month partner pilot is budgeted as an internal planning range of **R750,000–R1,250,000**, covering engineering/product delivery, independent security and privacy work, integration delivery, cloud/monitoring/support and contingency. This is not a supplier quotation and excludes funder capital and unknown enterprise licence fees.

The first commercial measurements are cost per verified application, time to decision-ready evidence, exception rate, customer-confirmation completion, active SME retention and funder conversion. See [PRODUCT-PLAN.md](PRODUCT-PLAN.md).

## 6. Scalability and Interoperability — 15 points

- Tenant and role boundaries allow additional organizations without cloning the product.
- Currency and dates use structured codes/formats rather than display text.
- V001–V012 rules are versioned, so results remain explainable as policy evolves.
- External compliance uses a provider-neutral lifecycle and reference instead of storing provider-specific confidential reports.
- Customer and funding connections sit behind authorised server-side adapter contracts.
- Authenticated customer confirmation remains a truthful fallback when an integration is unavailable.
- Responsive and accessible layouts support different devices and operating contexts.

Geographic expansion still requires local legal, privacy, tax, credit and language review. The architecture is adaptable; the submission does not claim automatic regulatory portability.

## Honest MVP boundary

ProofFlow demonstrates a technically working evidence and decision workflow. It does not claim a bank partnership, completed KYC/KYB, real ERP responses, production certification, credit approval or transferred funds. Those boundaries protect end users and make the next-stage partner work clear.
