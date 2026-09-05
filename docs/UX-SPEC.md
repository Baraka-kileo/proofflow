# ProofFlow UX specification

## Shared application shell

ProofFlow is one role-aware application for SMEs, large customers, and funding partners. Desktop uses a persistent navigation rail and mobile uses a compact top bar with bottom navigation. The signed-in organization and role are always visible. Each page has one clear primary action and provides appropriate loading, empty, error, success, and disabled states.

## Public pages

The landing page explains the working-capital problem, ProofFlow's evidence workflow, the boundary between evidence verification and a funder's independent decision, and the launch model: SMEs and large customers participate free while a funder pays 5% of its collected financing fee after successful funding, capped at R1,000 per funded invoice. Calls to action lead to account access or an appropriate product path. The security page explains private storage, tenant isolation, manual evidence handling, auditability, external compliance, and independent funding.

## Login

Email and password are the primary controls. When explicitly enabled by server configuration, a secondary `Credentials for testing` panel can fill fictional SME, large-customer, or funder credentials. It never signs in automatically and does not change product behaviour.

## Role dashboards

- SME: next application task, application history, funding proposals, and Trust Passport progress.
- Large customer: confirmation queue, exceptions, completed decisions, and supplier history.
- Funder / Bank: funding-ready applications, external compliance progress, proposals, and portfolio history.

Dashboard data comes from the authenticated tenant. Fictional seed records populate the same schema and workflows used by ordinary records.

## Application creation and evidence entry

The SME creates an application, uploads one purchase order, one delivery record, and one invoice, then enters the required transaction values in a document-by-document workspace. Desktop places the source document beside the fields; mobile switches between source and fields without losing progress.

Every field has a persistent label and supporting-document association. ProofFlow records the entering user and timestamp. The SME reviews all fields and accepts a final declaration before submission. The server validates the complete 21-field payload and saves it atomically; partial submissions never advance the application.

## Twelve transparent document checks

The application explains that ProofFlow compares names, references, currency, totals, invoice arithmetic, date order, delivery acknowledgement, exact file fingerprints, invoice identity and customer confirmation. Each result shows pass, review or fail, the values compared, a plain explanation and a secondary audit ID such as V005. The IDs are traceability labels, not a score. Verification is distinct from funding approval. Corrections return the SME to evidence entry, while a clean package can proceed to large-customer verification.

## Large-customer verification

ProofFlow uses the following hierarchy:

1. An authorized ERP/API connection, when one actually exists.
2. Supported structured customer records.
3. Authenticated manual customer confirmation.

An unavailable integration never produces a fabricated response. Manual confirmation presents six numbered questions, a review summary, and a versioned declaration. A `No` answer requires an explanation and creates a dispute. Completed decisions become immutable receipts; eligible users can download the corresponding certificate.

## Funder review and external compliance

The funder sees a read-only funding-ready evidence package, source documents, verification results, the customer decision, and audit history. A dedicated compliance panel records only the external status, funding partner, provider/reference, completion or expiry dates, and actor/timestamp.

The interface states that the selected funding partner or its approved provider performs KYC/KYB. ProofFlow displays progress and does not make or store the underlying compliance decision, biometrics, identity selfies, sanctions reports, or confidential reasoning.

## Funding proposals

The funder independently records a proposal or decline. Proposal terms identify the funder's advance, financing fee, net amount, and expiry. The SME may accept or decline once. Acceptance means the proposal is awaiting the funding partner's external completion process; it does not claim that money moved. A future authorized partner callback may record a real disbursement confirmation.

## Trust Passport

The Trust Passport is an evidence-based history, not a credit score. It shows customer-confirmed applications, disputes, verified value, confirming organizations, and dated links to source records. It never guarantees funding or repayment.

## Accessibility and responsive behaviour

Keyboard order follows the visual flow, focus is visible, dialogs trap and restore focus, headings are hierarchical, inputs retain labels, and dynamic status changes use live regions. Text contrast targets WCAG 2.2 AA, meaningful controls are at least 44px, layouts reflow at 200% zoom, motion lasts 150-250ms, and reduced-motion preferences are respected.
