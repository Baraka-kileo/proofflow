# ProofFlow synthetic evidence packs

Every file is fictional, visibly marked as Demo material, and contains no real person, company, bank, or transaction data.

## `valid`

Three internally consistent documents bound to the explicit hash-based Demo extraction provider. Expected verification: V001-V011 pass and V012 remains review until the buyer confirms.

## `mismatch`

Three deliberately inconsistent documents for explainable verification testing. Expected results are listed in `expected.json`: buyer, PO reference, currency, invoice amount, invoice arithmetic, issue-date ordering, and delivery-date ordering fail; receiver/signature evidence requires review.

## `duplicate`

Byte-for-byte copies of the valid pack under a separate pack path. Submit the valid pack first, then the corresponding duplicate file. The SHA-256 is intentionally identical and V009 must fail. The extraction fixtures are identical because the underlying bytes are identical.

Regenerate the files with `scripts/generate-sample-packs.py`. The three canonical source PDFs in `output/pdf` remain unchanged so their hash-bound Demo extraction fixtures stay stable.
