# User flows

## SME portal

1. Start an application and identify the large customer, purchase order, invoice, value and requested funding.
2. Upload the purchase order, delivery evidence and invoice to private document slots.
3. Read each document and enter all 21 required facts.
4. Review the values, accept the declaration and submit the complete evidence set.
5. Run 12 transparent document checks and correct any clear contradiction.
6. Ask the large customer to confirm the receivable when no authorised customer-system match is available.
7. Follow confirmation and funder-review status from the application.
8. Review a funder's transparent terms and accept or decline once.
9. Use the Trust Passport to revisit customer-confirmed transaction history.

## Large-customer portal

1. Open an assigned request from the confirmation queue.
2. Review the transaction summary, source context and any check needing attention.
3. Answer six questions about the order, delivery, invoice, amount, outstanding status and payment date.
4. Explain every `No` answer.
5. Review all answers, enter job title, draw a signature and accept the versioned declaration.
6. Submit once. The result becomes a read-only confirmation or dispute.
7. View the receipt or download the generated confirmation certificate from History.

## Funder / Bank portal

1. Open a package only after eligible customer evidence exists.
2. Review the SME, invoice, purchase order, values, 12 document checks, customer confirmation and audit trail.
3. Open the customer confirmation certificate when required.
4. Perform KYC/KYB, AML and underwriting in the funder's regulated process or approved provider.
5. Record only the external compliance status, provider and reference in ProofFlow.
6. Independently decline or create a proposal with advance percentage, financing fee and expiry.
7. Complete contracts and disbursement outside ProofFlow. A future authorised callback may record actual completion.

## State distinction

`Evidence consistent` → `Customer confirmed` → `Funder review` → `Proposal accepted` are separate states. None of the earlier states means credit approval or money movement.

See [FEATURE-GUIDE.md](FEATURE-GUIDE.md) for illustrated portal evidence.
