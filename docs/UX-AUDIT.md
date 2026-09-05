# ProofFlow Phase 9 experience audit

Audit date: 5 September 2026
Scope: the hosted-data hackathon MVP at the Phase 9 commit. All people, organizations, invoices, and documents used during the audit are synthetic Demo records.

## Result

The SME, buyer, and funder journeys are usable without hidden or decorative actions. Core routes were inspected at 390×844, 768×1024, and 1440×900 with no horizontal overflow. Protected authorization failures disclose no record details. The financing journey remains visibly simulated, and the absence of a configured Gemini key remains an explicit Demo-extraction boundary rather than a silent mock.

## Route and state matrix

| Route / surface | Loading | Empty | Success | Error / recovery | Permission / disabled state |
|---|---|---|---|---|---|
| `/` | Stable server-rendered hero | Not applicable | Story, three-role flow, scope disclosure, and working links | Unknown routes use the public not-found page with a return action | No private information or implied live financing |
| `/login` | Submission state changes immediately | Not applicable | Hosted session redirects to the role dashboard | Field errors link to persistent labels; invalid credentials use one generic message; Demo service failure remains generic | Buyer/funder public registration is absent; demo quick entry is labelled |
| `/dashboard` — SME | Protected skeleton mirrors header, metrics, and cards | No applications offers `Start application` | Metrics, current application, completed decisions, and Trust Passport action | Route error offers a real retry; offline banner warns that an action may not be saved | Only SME links and records are rendered; unavailable records are not actionable |
| `/dashboard` — buyer | Same protected shell geometry | Clear queue states that no confirmations are waiting | Pending items and immutable confirmed/disputed history open their receipts | Hosted query failure reaches the generic retry boundary | No SME/funder navigation; completed decisions have no mutation controls |
| `/dashboard` — funder | Same protected shell geometry | Clear queue and decision-history empty states | Eligible buyer-confirmed packages and immutable offer/decline history open correctly | Hosted query failure reaches the generic retry boundary | Pending/disputed buyer records are excluded; finance labels say `Simulated` |
| `/applications/new` | Route loading preserves the task layout | New form is itself the empty start | Valid values create a private hosted draft | Linked error summary covers buyer, amount, date, and consent; submission can be retried | Buyer/funder receive a generic protected not-found result |
| `/applications/[id]` — SME | Route-specific shell and application skeleton | Missing record fails closed | Draft recovery, upload, extraction review, verification, buyer status, certificate, and offer state all derive from hosted data | Upload retry/removal, extraction retry, expired preview, verification correction, and route retry are explicit | Later steps remain locked with their prerequisite; completed material decisions are immutable |
| `/applications/[id]` — funder | Evidence workspace skeleton | Ineligible/missing record fails closed | Frozen fields, documents, V001–V012, buyer receipt, and audit trail are readable | Preview or route failures have safe recovery | Read-only evidence; no SME correction controls |
| Extraction review | Stable document/field workspace | Missing candidates identify what must be corrected | All 21 fields retain provenance and edit state across views | Unsafe/malformed extraction is rejected; provider failure says to retry; preview expiry says to reopen | Verification cannot run before complete human review |
| `/confirmations/[id]` | Focused task skeleton | Missing/ineligible request fails closed | Six answers, conditional explanations, summary, declaration, drawing, and immutable receipt are complete | A `No` requires an explanation; back/correction retains answers; save failure is safe and retryable | Only pending buyer records can be decided; disputes bypass signature; completed records cannot change |
| `/confirmations/[id]/certificate` | Certificate loading remains inside the protected shell | Unsigned/disputed records have no certificate action | Authorized roles view the same immutable receipt and download the generated PDF | Unavailable generation fails closed without exposing another record | Buyer, owning SME, and eligible funder only |
| `/offers/[id]` — funder | Evidence and offer areas keep their layout | Missing/ineligible record fails closed | Review, deterministic terms, offer, or reasoned decline produce immutable receipts | Invalid percentages/date and hosted failure provide plain messages | Decision controls disappear after decision; every money surface says `Simulated` |
| `/offers/[id]` — SME | Stable comparison layout | Missing/ineligible offer fails closed | Terms, confirmation dialog, accept/decline, and final simulation receipt are clear | Expired offer and stale/replayed actions explain that the response was not saved or cannot continue | One response only; completion does not claim real disbursement |
| `/trust-passport` | Metric/timeline skeleton | Explains how verified evidence will appear and links to a new application | Metrics and dated source links derive only from completed hosted evidence | Route retry is available | SME only; explicitly not a score or funding guarantee |
| `/help` | Protected shell loading | Not applicable | Explains the three roles, recovery, privacy, and simulation boundaries | Access problems direct the user back to Overview | Available from every role navigation |
| `/account` | Protected shell loading | Missing session redirects safely | Server-derived name, organization, role, verified email, and sign-out | Auth/session failure is generic | Available from desktop rail and the mobile top-bar account action |
| System states | Root and protected loading pages are geometry-stable | Reusable empty cards have one relevant next action | Online restoration removes the live alert | Offline state warns before submission and offers reload; route errors offer retry; public/protected not-found pages offer a safe return | Unauthorized record IDs receive the same generic not-found result |

## Responsive evidence

Core public and authenticated routes were checked at all required sizes:

- 390×844: compact top bar, role bottom navigation, stacked cards/forms, signature flow, document review, receipts, Help, Account, and system states remain usable. Content receives bottom clearance so navigation does not cover actions.
- 768×1024: tablet layout uses compact navigation and readable single/two-column content without clipping.
- 1440×900: desktop rail, sticky task/evidence areas, decision forms, history, and source links remain aligned.

Every audited page reported `scrollWidth === clientWidth`. Dialogs and sticky regions did not cover primary content. Long invoice, approval, and organization identifiers wrap safely.

## Accessibility evidence

- Keyboard order follows the visible flow; the skip link and focus-visible rings are present.
- The account action retains a visible focus outline on mobile.
- The Radix confirmation dialog traps focus and restores it to the trigger; this is covered by a component interaction test.
- Pages have one main landmark and a hierarchical primary heading. The protected not-found boundary was corrected to avoid a nested main landmark.
- Inputs retain visible labels; invalid form summaries link back to the affected field.
- Status, progress, upload, offline, and submission feedback use live regions where state changes.
- Public and protected interactive targets are at least 44px. Compact header links and the small secondary button were corrected during the audit.
- Browser zoom was exercised at approximately 200%; the layout reflowed without horizontal overflow.
- Reduced-motion mode removes non-essential reveal animation; remaining transitions communicate hover, focus, progress, dialog, or state changes within the 150–250ms design range.

Automated color linting is not part of this repository. Token pairs were visually reviewed against the existing WCAG-oriented palette; a formal production accessibility review with assistive-technology users remains a release task.

## Failure rehearsal

| Failure | Evidence and recovery |
|---|---|
| Gemini timeout | Bounded adapter retries once, then returns `Live extraction is temporarily unavailable. Please retry.` without leaking provider details. |
| Malformed Gemini response | Strict Zod parsing rejects it without persistence and shows `The AI response was not safe to use. Please retry.` |
| Upload interruption / failure | Reducer preserves the prepared file for Retry or Cancel; terminal validation removes incomplete hosted state. |
| Expired signed preview | Private preview expiry is enforced; review UI says the preview expired/unavailable and offers reopening. |
| Exact duplicate bytes | V009 rejects the renamed duplicate, does not admit it to extraction, and exposes no other tenant or document identity. |
| Duplicate/stale submission | Buyer decisions and funder decisions/responses are immutable; exact replay returns the receipt while changed replay or invalid state is rejected. |
| Offline / slow response | Immediate pending feedback prevents double intent; offline live alert warns that the latest action may not be saved and offers retry after reconnection. |
| Database or authorization denial | Server role/ownership checks plus RLS fail closed into a generic error/not-found state. Cross-tenant IDs and hashes disclose no existence or details. |

## Sample pack inventory

`samples/evidence-packs` contains three clearly synthetic PDF sets plus expected structured values:

- `valid`: internally consistent purchase order, delivery evidence, and invoice.
- `mismatch`: deliberate buyer, PO, currency, total, arithmetic, date-order, and receiver-signature issues with documented V001–V012 outcomes.
- `duplicate`: byte-identical copies of the valid documents; the expected context proves V009 fails when a hash already exists for the supplier organization.

The generator is deterministic and the unit suite verifies PDF signatures, file completeness, expected field contracts, byte equality, and deterministic rule results. No real identity, bank data, customer document, or third-party logo is included.

## Remaining production limitations

- Live Gemini extraction requires a configured server-side key; the judged fallback supports only bundled synthetic sample hashes and is visibly labelled.
- Buyer identity is the authenticated corporate account plus an in-app drawn acknowledgement. Production rollout still needs jurisdiction-specific electronic-signature, identity-assurance, retention, and legal review.
- Offers and funding completion are simulations. A production service requires a regulated funding partner, underwriting and mandates, enforceable agreements, payment rails, reconciliation, monitoring, and incident procedures.
- Formal WCAG testing with screen readers and disabled users, performance testing under production traffic, and independent security review remain release work.
