# ProofFlow

### Funding starts with evidence everyone can trust.

[![CI](https://github.com/Baraka-kileo/proofflow/actions/workflows/ci.yml/badge.svg)](https://github.com/Baraka-kileo/proofflow/actions/workflows/ci.yml)
[![Live application](https://img.shields.io/badge/live-application-087A66)](https://proofflow-sepia.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-111111)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6)](https://www.typescriptlang.org/)

ProofFlow is a privacy-first evidence workflow for invoice finance. It turns a purchase order, delivery evidence, an invoice and authenticated customer confirmation into one structured, traceable package that a funding partner can independently review.

**[Open the live application](https://proofflow-sepia.vercel.app)** · **[Visual feature guide](docs/FEATURE-GUIDE.md)** · **[Judge's guide](docs/JUDGING-GUIDE.md)** · **[Documentation index](docs/README.md)** · **[Security model](docs/SECURITY.md)**

![ProofFlow landing page showing a confirmed invoice-evidence package](docs/assets/proofflow-home.png)

> **Decision boundary:** ProofFlow verifies transaction evidence. It does not perform KYC/KYB, approve credit, lend money, set rates, hold funds or guarantee repayment.

## The problem

An SME may have completed real work and issued a valid invoice, yet still wait weeks for payment. A potential funder cannot responsibly act on an invoice alone: the purchase order, delivery, invoice and buyer acknowledgement must agree, while confidential documents must remain controlled. The resulting manual back-and-forth is slow for the SME and expensive to review.

ProofFlow creates a shared evidence trail without pretending to replace regulated judgement:

- the **SME** uploads three private documents, enters 21 required facts and makes a declaration;
- **ProofFlow** runs 12 transparent checks across names, references, currency, amounts, arithmetic, dates, delivery acknowledgement and duplicates;
- the **large customer** confirms or disputes the underlying transaction;
- the **funding partner** performs KYC/KYB and underwriting externally, then records its independent proposal or decline.

## Judge fast path

Allow about five minutes:

1. Open the [live application](https://proofflow-sepia.vercel.app) and review the problem, workflow, pricing and trust boundary.
2. Select **Log in**. The optional **Sample credentials for testing** panel offers SME, large-customer and funder accounts; selecting a role fills the form but never signs in automatically.
3. As the SME, inspect the application journey, private evidence, 12 document-check results and Trust Passport.
4. Sign out and inspect the large-customer confirmation workspace.
5. Sign out and inspect the funder's external-compliance and proposal workspace.
6. Open the public [security page](https://proofflow-sepia.vercel.app/security).

All hosted records are fictional. They exercise the same role-based workflow as any other account; there is no separate simulation product.

## How the workflow works

```mermaid
flowchart LR
    SME["SME supplier"] -->|"Uploads PO, delivery evidence and invoice"| ENTRY["Manual evidence entry"]
    ENTRY --> RULES["12 transparent document checks"]
    RULES --> BUYER["Authenticated customer confirmation"]
    BUYER --> PACKAGE["Traceable funding package"]
    PACKAGE --> FUNDER["Independent funder review"]
    KYC["External KYC / KYB provider"] -->|"Status and reference only"| FUNDER
    FUNDER --> DECISION["Proposal or decline"]
```

### Responsibility by stage

| Stage | Accountable party | What ProofFlow does |
|---|---|---|
| Evidence submission | SME | Private upload, structured manual entry and declaration |
| Evidence checking | ProofFlow | Compares names, references, amounts, dates, delivery acknowledgement and duplicates, then records the result |
| Transaction confirmation | Large customer | Supports authorised system evidence or authenticated confirmation |
| KYC/KYB and AML | Funder or approved provider | Stores only workflow status and an external reference |
| Credit, pricing and underwriting | Funding partner | Presents evidence; never makes or disguises the decision |
| Contracting and disbursement | Funding partner | Waits for a future authorised confirmation; never fabricates money movement |

## What is innovative

ProofFlow's novelty is the combination of a compact, multi-party workflow and a deliberately narrow trust boundary:

- **Evidence lineage, not a black-box score.** Each entered fact retains its source document, actor and timestamp.
- **Explainable checks.** Every result shows the compared values and why it passed, needs review or failed rather than returning an opaque score.
- **Privacy-minimising design.** Sensitive files are not sent to an AI service; KYC/KYB documents and screening reasoning remain with the regulated party.
- **No manufactured certainty.** Missing integrations fail closed and route to authenticated confirmation. “Evidence verified” never becomes “funding approved.”
- **One product, three perspectives.** SME, customer and funder views share the same application and audit history while enforcing different permissions.

See the complete [judging-criteria evidence map](docs/JUDGING-GUIDE.md).

## Technical architecture

```mermaid
flowchart TB
    UI["Next.js 16 + React 19 interface"] --> ACTIONS["Server actions and route handlers"]
    ACTIONS --> AUTH["Server-side role and membership checks"]
    AUTH --> DB["Supabase Postgres + Row Level Security"]
    AUTH --> STORAGE["Private Supabase Storage + signed URLs"]
    ACTIONS --> RULES["Versioned TypeScript verification rules"]
    ACTIONS -. "authorised adapters only" .-> PARTNERS["Customer and funding-partner systems"]
    DB --> AUDIT["Append-only workflow audit events"]
```

| Layer | Choice | Why it fits |
|---|---|---|
| Web application | Next.js 16, React 19, TypeScript | One responsive application with server-rendered public and protected role views |
| Identity and data | Supabase Auth and PostgreSQL | Authenticated sessions, relational evidence lineage and transactional writes |
| Authorisation | Server checks plus Row Level Security | Defence in depth across organization and role boundaries |
| Documents | Private Supabase Storage | Controlled paths and short-lived signed access rather than public URLs |
| Validation | Zod plus database constraints | Complete payload validation before atomic persistence |
| Evidence checks | Published TypeScript comparisons | The same 12 checks run every time and show the values and reason a person can challenge |
| Delivery | Vercel and GitHub Actions | Reproducible production builds and automated quality gates |

Historical database names relating to earlier prototypes remain only where required for migration compatibility. The current application contains no AI processing or interactive simulated connector.

## Security and privacy

![ProofFlow security page showing its six responsibility boundaries](docs/assets/proofflow-security.png)

Key implemented controls include server-enforced role checks, tenant Row Level Security, private object storage, expiring signed URLs, file validation, SHA-256 duplicate detection, atomic manual-evidence submission and traceable state changes. Integrations fail closed. ProofFlow records external compliance workflow metadata but does not collect biometrics or confidential screening reports.

This is a hackathon MVP, not a claim of regulatory certification. Independent penetration testing, legal/privacy review, operational monitoring, retention controls and incident-response rehearsal are required before onboarding real organizations. Read the [threat model and control matrix](docs/SECURITY.md).

## Business model

ProofFlow keeps the essential trust workflow accessible and charges where automation creates operational value.

| Offer | Customer | Included | Revenue |
|---|---|---|---|
| **Core** | SME | Evidence upload, manual entry, 12 transparent checks, customer confirmation, funding application and Trust Passport | Free |
| **Connect** | Large customer / enterprise | Authorised ERP integration, automatic lookup, bulk suppliers, exception handling, API/webhooks, reporting and multi-entity controls | Contract subscription and integration fee |
| **Funding Partner** | Bank or alternative funder | Review workspace, external-compliance status, portfolio tools, API/webhooks and reporting | Platform fee and/or agreed share of the funder's collected financing fee after successful funding |

ProofFlow does **not** take a percentage of the invoice principal or the SME advance. Any fee-sharing arrangement requires partner, legal and regulatory approval. The [product plan](docs/PRODUCT-PLAN.md) records the pilot budget assumptions, unit economics to validate and scale strategy.

## Repository map

```text
.
├── .github/                 CI and responsible disclosure guidance
├── docs/                    Product, architecture, security, UX and judging evidence
│   └── assets/              Current product screenshots used in this README
├── samples/sample-documents-for-testing/  Fictional consistent, mismatch and duplicate PDFs
├── scripts/                 User provisioning and fixture generation
├── src/app/                 Next.js routes, layouts, actions and public pages
├── src/components/          Shared accessible UI building blocks
├── src/features/            Role workflows and domain interfaces
├── src/lib/                 Auth, evidence, verification, integration and data logic
├── supabase/migrations/     Ordered schema, functions, policies and storage changes
└── tests/                   Unit, browser and database integration tests
```

Start with [docs/README.md](docs/README.md) rather than reading the historical implementation log from top to bottom.

## Run locally

### Prerequisites

- Node.js 22
- npm
- a Supabase project or local Supabase stack

### Setup

```bash
git clone https://github.com/Baraka-kileo/proofflow.git
cd proofflow
npm ci
cp .env.example .env.local
npx supabase db push
npm run supabase:seed
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env.local` instead of `cp`.

Configure these values in `.env.local`:

| Variable | Exposure | Purpose |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Browser-safe | Canonical application origin |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser-safe | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe | Supabase publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server secret | Restricted provisioning and administrative operations |
| `PROOFFLOW_ENABLE_TEST_CREDENTIALS` | Server configuration | Enables the optional login-only test-account picker |
| `PROOFFLOW_TEST_PASSWORD` | Server secret | Shared password for provisioned fictional test accounts |

Never add `.env.local`, service-role keys, real customer files or personal information to Git.

## Verification

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run build
npm run test:e2e
```

GitHub Actions runs lint, type checking, all unit tests and the production build on every push to `main` and every pull request. Database integration scripts under `tests/integration/` require a configured Supabase environment.

## See the product before reading the code

### SME portal

![SME portal with evidence progress and current application](docs/assets/sme-portal.png)

The SME builds the package: three private source documents, 21 manually entered facts, 12 understandable checks, customer confirmation, funding proposals and a reusable Trust Passport.

### Large-customer portal

![Large-customer portal with confirmation and decision-history tasks](docs/assets/customer-portal.png)

The customer confirms the real-world transaction through six questions, a reviewed declaration and signature. The completed decision becomes an immutable receipt and downloadable certificate.

### Funder / Bank portal

![Funder portal with review-ready evidence and recorded decisions](docs/assets/funder-portal.png)

The funder reviews the evidence, performs KYC/KYB and underwriting externally, records limited compliance progress and makes its own proposal or decline.

See the illustrated [feature guide](docs/FEATURE-GUIDE.md) for the document checks, certificate lifecycle and funder-review screen.

## What are V001–V012?

They are simply audit IDs for 12 published checks—not a credit score and not AI. The checks answer questions such as:

- Do the customer, supplier and purchase-order references agree across all three documents?
- Does the invoice amount fit the order and does subtotal plus tax equal the total?
- Do the order, delivery and invoice dates occur in a sensible sequence?
- Is the delivery acknowledged?
- Has the exact file or invoice identity already been submitted?
- Has the large customer confirmed the receivable?

Every result displays **Pass**, **Review** or **Fail**, the values compared and a plain reason. Read the [complete check guide](docs/VERIFICATION-CHECKS.md).

## Current scope and limitations

The implemented MVP includes the complete role-aware evidence journey, external-compliance status boundary and independent funding proposal boundary. The following deliberately remain outside the submission:

- live ERP, bank and compliance-provider credentials;
- automatic lending, credit scoring, pricing or disbursement;
- storage of raw KYC/KYB identity evidence;
- claims of bank partnership, certification or completed money movement;
- production onboarding before independent security, privacy, legal and accessibility review.

See [ROADMAP.md](docs/ROADMAP.md) for the authorised-integration path.

## Documentation

| Read this | For |
|---|---|
| [Judging guide](docs/JUDGING-GUIDE.md) | Direct evidence for every scoring category |
| [Visual feature guide](docs/FEATURE-GUIDE.md) | Screenshots and plain-language portal tour |
| [Document-check guide](docs/VERIFICATION-CHECKS.md) | Meaning of all 12 transparent checks |
| [Product scope](docs/PRODUCT-SCOPE.md) | MVP boundaries and non-goals |
| [Product plan](docs/PRODUCT-PLAN.md) | Responsibility model, business model and pilot plan |
| [User flows](docs/USER-FLOWS.md) | SME, customer and funder journeys |
| [Architecture](docs/ARCHITECTURE.md) | Components, data flow and integration boundaries |
| [Security](docs/SECURITY.md) | Threats, controls, privacy and production gaps |
| [UX specification](docs/UX-SPEC.md) | Interaction, responsive and accessibility requirements |
| [Build checklist](docs/BUILD-CHECKLIST.md) | Completion gates |
| [Implementation log](docs/IMPLEMENTATION-LOG.md) | Chronological engineering evidence |

## Contributing and responsible disclosure

See [CONTRIBUTING.md](CONTRIBUTING.md) for the local quality contract. Please report security issues privately using [GitHub Security Advisories](https://github.com/Baraka-kileo/proofflow/security/advisories/new), not a public issue.

This repository is an ABSA Studentpreneur Hackathon 2026 submission. No open-source licence has been granted.
