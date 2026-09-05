# Sample documents for testing

These fictional PDFs let reviewers and developers exercise the document upload and evidence-checking workflow without using confidential business information. They contain no real person, organization, bank or transaction data.

## Available sets

### `valid`

One purchase order, one delivery record and one invoice whose names, references, currency, totals, arithmetic and dates agree. Use this set to see the normal evidence path. Customer confirmation remains a separate step.

### `mismatch`

Three intentionally inconsistent documents. They demonstrate how ProofFlow explains problems with the customer name, order reference, currency, invoice amount, arithmetic, date sequence and delivery acknowledgement.

### `duplicate`

Byte-for-byte copies of the valid set stored under a different path. Uploading a corresponding file after the original demonstrates that SHA-256 duplicate detection finds renamed copies.

Each directory includes `expected.json`, which records the values a tester should enter and the expected audit-rule results. Read [the plain-language check guide](../../docs/VERIFICATION-CHECKS.md) before using those IDs.

## Safety boundary

These files test the real product workflow, but they are not proof of a real customer connection, customer confirmation, credit decision or money movement. Regenerate them with `scripts/generate-sample-packs.py`; keep all content fictional.
