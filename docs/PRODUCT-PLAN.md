# ProofFlow product, business and delivery plan

## Product decision

ProofFlow is one production-style, role-aware application. Fictional records populate the normal workflow; they do not switch the product into a different mode. The only testing convenience is an optional credentials panel on the login page.

## Responsibility model

| Stage | Responsible party | ProofFlow's role |
|---|---|---|
| Evidence submission | SME | Private upload, structured manual entry and declaration |
| Evidence verification | ProofFlow | Twelve published checks across identity, references, amounts, dates, acknowledgements and duplicates, with an audit trail |
| Transaction confirmation | Large customer | Authorised record check or authenticated confirmation |
| KYC/KYB and AML | Funding partner/provider | Display status and external reference only |
| Credit, pricing and underwriting | Funding partner | Present evidence; never make the decision |
| Contracting and disbursement | Funding partner | Await an authorised callback; never fabricate transfer |

## Implemented evidence contract

The SME enters 21 required fields across the purchase order, delivery evidence and invoice. Values retain their supporting document, entering user, timestamp and final declaration. Validation covers exact field membership, non-empty values, ISO dates, currency codes, boolean evidence and decimal money. Submission is atomic and idempotent.

## Customer verification hierarchy

1. Real authorised ERP/API connection.
2. Supported structured customer records.
3. Authenticated customer confirmation.

If no authorised connection exists, ProofFlow explains this and uses confirmation. It never manufactures a Coupa, SAP or customer response.

## External compliance and funding

Compliance statuses are Required, In progress, Additional information required, Completed, Unable to verify and Expired. Stored fields are limited to status, funding partner, approved provider name, external reference, completion/expiry times, recording user and audit timestamps. Raw identity evidence and confidential screening reasoning stay with the regulated party.

ProofFlow verifies transaction evidence. It does not automatically approve funding, generate a credit score, lend, hold funds, set financing rates or guarantee repayment. “Evidence verified” is not “funding approved.”

## Business model

The monetisation principle is to keep the crucial trust workflow accessible and charge for operational automation, integration and portfolio value.

| Offer | Buyer | Value | Revenue mechanism |
|---|---|---|---|
| Core | SME | Submission, manual evidence entry, 12 transparent checks, customer confirmation, funding application and Trust Passport | Free |
| Connect | Large customer / enterprise | Authorised ERP lookup, bulk suppliers, exceptions, API/webhooks, reporting, multi-entity controls and support | Contract subscription plus scoped integration/onboarding fee |
| Funding Partner | Bank / alternative funder | Evidence workspaces, compliance-status integration, portfolio workflow, API/webhooks and reporting | Platform fee and/or contracted share of collected financing fees after successful funding |

ProofFlow does not take a percentage of invoice principal or the SME advance. A fee share is only on the funder's collected financing revenue and remains subject to commercial, legal, tax and regulatory review.

### Economics to validate in a pilot

- cost and review time per decision-ready application;
- reduction in repeated evidence requests;
- percentage of applications needing an exception;
- customer-confirmation completion time;
- conversion from verified package to funder decision;
- active SME retention and repeat use;
- enterprise integration/onboarding cost and support load;
- net platform revenue after cloud, support and partner costs.

No unvalidated market-size or savings claim is presented as fact.

## Six-month partner pilot estimate

This is an internal planning range, not a supplier quotation. It excludes lending capital and unknown third-party enterprise licence fees.

| Workstream | Planning range (ZAR) | Outcome |
|---|---:|---|
| Product and engineering | R400,000–R650,000 | Production hardening, partner workflows, administration and support tooling |
| Independent security, privacy and legal | R100,000–R200,000 | Penetration test, DPIA, contracts, policies and remediation |
| One customer and one funding integration | R100,000–R200,000 | Authorised sandbox adapters, signed callbacks and reconciliation |
| Cloud, monitoring and pilot support | R50,000–R100,000 | Environments, observability, backups, incident response and user support |
| Research and contingency | R100,000 | SME/funder testing and unknown partner requirements |
| **Total** | **R750,000–R1,250,000** | Controlled six-month pilot with named partners |

Funding would be released by milestone: security/legal foundation, authorised sandbox integration, closed user pilot, then measured go/no-go review.

## Scalability and interoperability

- A tenant-aware model adds organizations and memberships without duplicating the application.
- Role-specific views reuse a shared workflow and audit history.
- Structured ISO dates and currency codes support localisation behind presentation formatting.
- Versioned rules preserve the meaning of historical verification results.
- Provider-neutral compliance states avoid binding the product to one KYC/KYB vendor.
- Customer and funding integrations use server-side adapters and authorised credentials.
- Authenticated confirmation remains a truthful fallback where integrations are unavailable.

Expansion to another country is a planned adaptation, not an automatic claim: local privacy, credit, tax, language, currency and contracting requirements must be reviewed first.

## Seed-data strategy

Use fictional South African organizations, reserved example email domains, realistic ZAR amounts, references, dates, confirmations and histories. Normal product surfaces do not label every record as test data. Seed tooling and documentation disclose that records are fictional; they must not impersonate real institutions or claim a real external transfer.

## Implementation status

Completed in the current MVP:

1. removed AI code, dependencies, configuration, consent and product wording;
2. implemented manual evidence-entry database functions and UI;
3. disabled fabricated connector behaviour and retained authorised connector contracts;
4. added funding-partner external-compliance status;
5. removed interactive fake disbursement and established a callback boundary;
6. published pricing and security explanations;
7. refreshed fictional seed data and optional login-only test credentials;
8. applied hosted migrations and deployed the live application.

Production and partner-dependent work remains in [ROADMAP.md](ROADMAP.md) and [SECURITY.md](SECURITY.md).
