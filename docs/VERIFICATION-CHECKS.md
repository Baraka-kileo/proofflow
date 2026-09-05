# The 12 transparent document checks

“V001–V012” are audit labels, not a score and not AI. ProofFlow runs the same published comparisons every time. Each check shows **Pass**, **Review** or **Fail**, the values compared and a plain-language reason.

## What ProofFlow checks

| Audit ID | Plain-language question | Documents or evidence compared | Why it matters |
|---|---|---|---|
| V001 | Is the large customer's name consistent? | Purchase order, delivery evidence and invoice | A different customer name may mean the documents belong to different transactions |
| V002 | Is the supplier's name consistent? | Purchase order, delivery evidence and invoice | Confirms that the same SME appears throughout the evidence |
| V003 | Does the purchase-order reference match? | Purchase order, delivery evidence and invoice | Links the delivery and invoice back to the customer's order |
| V004 | Does the currency match? | Purchase order and invoice | Prevents amounts in different currencies from being treated as equal |
| V005 | Is the invoice total supported by the order? | Purchase-order total and invoice total | Flags over-invoicing; a lower invoice is marked for review because it may be a partial delivery |
| V006 | Does the invoice arithmetic add up? | Subtotal, tax and total | Detects calculation mistakes or altered totals |
| V007 | Was the purchase order created before delivery and invoicing? | Purchase-order, delivery and invoice dates | Checks that the transaction sequence is plausible |
| V008 | Did delivery occur before or on the invoice date? | Delivery and invoice dates | Flags an invoice that appears to predate the work or goods |
| V009 | Has the exact same file already been submitted by this SME? | SHA-256 file fingerprints | Detects renamed copies without exposing another organization's files |
| V010 | Has this SME already used the same invoice number? | Normalized supplier and invoice identity | Prevents the same invoice identity being financed twice in the workspace |
| V011 | Does the delivery evidence show acknowledgement? | Receiver/signature indicator | Missing acknowledgement needs human review |
| V012 | Has the large customer confirmed the receivable? | Authenticated customer decision | A confirmation passes, a dispute fails and a pending request remains under review |

## How to read the result

- **Pass:** the available evidence agrees with the published rule.
- **Review:** information is missing or the situation may be legitimate but needs a person, such as a partial delivery.
- **Fail:** the evidence contradicts the rule, such as an invoice exceeding the order or a known duplicate.

The overall evidence result is **Fail** if any check fails, **Review** if none fail but at least one needs review, and **Pass** only when every check passes. A pass means the transaction evidence is internally consistent; it does not mean funding is approved.

## Example

If a purchase order says **R48,750**, the invoice says **R48,750**, subtotal plus tax equals **R48,750**, all references match and no duplicate is found, those checks pass. If the invoice instead says **R58,750**, the order-total check fails and the package cannot be treated as clean evidence until corrected or resolved.

The executable rules are in `src/lib/verification/rules-v1.ts`; tests in `tests/unit/verification-rules-v1.test.ts` deliberately break each fact to prove that the expected check changes result.
