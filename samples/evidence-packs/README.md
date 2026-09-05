# Fictional evidence packs

These documents are fictional development fixtures. They contain no real person, organization, bank, or transaction information and are not a separate product mode.

## `valid`

Three internally consistent documents for testing manual evidence entry and deterministic V001-V012 verification.

## `mismatch`

Three deliberately inconsistent documents. The expected values cover buyer, purchase-order reference, currency, amount, arithmetic, date-order, and receiver-signature checks.

## `duplicate`

Byte-for-byte copies of the valid pack under a separate path. Uploading a corresponding duplicate after the original proves that SHA-256 duplicate detection rejects renamed copies.

Regenerate these development fixtures with `scripts/generate-sample-packs.py`. Their content must remain fictional and must not be shown as evidence of a real external integration, customer confirmation, credit decision, or money movement.
