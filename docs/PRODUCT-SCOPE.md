# Product scope

## Problem

SMEs can deliver work today but wait 30–90+ days for a large buyer to pay. During that gap they struggle to pay wages, suppliers, and rent. Invoice finance can provide an advance, but onboarding and verification are often slow because evidence is fragmented, buyer confirmation is manual, and fraud risk is difficult to assess.

## Product promise

**ProofFlow turns three business documents and one buyer confirmation into a transparent, funder-ready evidence pack.**

The advance comes from a funder, not from the buyer. The buyer still settles the invoice at its normal due date. ProofFlow accelerates verification and coordination; it cannot guarantee funding.

## Primary users

- **SME:** creates an application, uploads evidence, reviews extracted fields, tracks verification, and responds to an offer.
- **Buyer:** sees requests addressed to their organization, answers six transaction-specific questions, signs an authorization declaration, and receives an immutable confirmation certificate; any `No` answer becomes a reasoned dispute.
- **Funder:** reviews only buyer-confirmed applications, sees explainable checks and the buyer certificate, and creates a simulated offer.

SMEs may self-register. Buyer and funder accounts are invited or seeded for the hackathon to prevent arbitrary people from assuming privileged roles.

## MVP in scope

- Authentication and role-based navigation
- Purchase order/contract, delivery/completion evidence, and invoice upload
- File validation, private storage, SHA-256 hash, and duplicate detection
- AI field extraction followed by SME review
- Deterministic cross-document verification with explainable pass/review/fail results
- Structured in-app buyer confirmation or reasoned dispute, drawn acknowledgement signature, and downloadable confirmation certificate
- Funder evidence review and simulated offer creation
- SME offer acceptance/decline and Trust Passport history
- Audit events, clear status timeline, responsive/accessibility states, and seeded demo journey

## Explicitly out of scope

- Real credit scoring, automatic approval, bank transfer, collections, and settlement reconciliation
- Open buyer/funder self-registration
- OCR/model training, accounting-platform integrations, qualified/trust-provider digital signatures, and production KYC/AML
- Email delivery in the core demo; in-app portals are the reliable MVP channel

## Success measures

- A first-time SME can submit three documents without explanation.
- A buyer can confirm in under 30 seconds.
- A funder can see exactly what the buyer confirmed, who signed, and when, without relying on an email or opaque approval button.
- A funder can understand why a package passed or needs review without reading every page.
- The complete seeded happy path can be demonstrated in under four minutes.
