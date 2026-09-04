# ProofFlow AI build protocol and checklist

This document is the executable delivery contract for the hackathon MVP. It is intentionally specific so that a coding agent does not invent requirements, skip security, build disconnected mock screens, or claim completion without evidence.

## 1. How an AI must use this file

### Start-of-work procedure

Before changing code, the agent must:

1. Read `AGENTS.md` and the Next.js guide relevant to the files being changed.
2. Read `PRODUCT-SCOPE.md`, `USER-FLOWS.md`, `UX-SPEC.md`, `DESIGN-SYSTEM.md`, `ARCHITECTURE.md`, and `SECURITY.md` once per working session.
3. Read this entire file and `IMPLEMENTATION-LOG.md`.
4. Run `git status --short --branch`. Preserve unrelated/user changes.
5. Select the first incomplete **MUST** work unit whose dependencies are complete.
6. State the work unit ID in the progress update, for example `Working on P2-04`.
7. Inspect existing code before installing, replacing, or duplicating anything.

### End-of-work procedure

For each work unit, the agent must:

1. Implement only the declared outcome and any necessary dependency.
2. Run the unit's automated checks.
3. Inspect the affected UI in a real browser if it has a visual or interactive surface.
4. Test the named failure/empty/loading paths, not only the happy path.
5. Add an entry to `IMPLEMENTATION-LOG.md` with changed files, checks, manual evidence, assumptions, and remaining risks.
6. Change `[ ]` to `[x]` only when every acceptance item for that unit is true.
7. Run the phase gate before moving to the next phase.
8. Commit a coherent green change. Never commit `.env.local`, credentials, real invoices, or customer information.

### Status and priority notation

- `[ ]` not started or not proven
- `[x]` implemented and proven with evidence in `IMPLEMENTATION-LOG.md`
- **MUST** required for the judged end-to-end demo
- **SHOULD** complete after all MUST items needed by the demo are green
- **FUTURE** belongs in `ROADMAP.md`, not the hackathon build

Markdown has no honest “partly complete” state. Leave partial work unchecked and describe it in the implementation log.

### Definition of done for every UI unit

A UI unit is not complete until it has:

- Final content—no lorem ipsum, dead links, unexplained acronyms, or unlabeled simulation.
- Default, hover, focus-visible, pressed, disabled, loading, empty, error, and success states where applicable.
- Keyboard operation, visible focus, persistent labels, correct headings, and text/icon/color status communication.
- No horizontal overflow at 390px, 768px, and 1440px; touch targets are at least 44×44px.
- Purposeful 150–250ms motion and a `prefers-reduced-motion` alternative.
- No console errors or hydration warnings.
- A working action or an explicitly disabled control with an explanation. A decorative button is a defect.

### Definition of done for every backend unit

A backend unit is not complete until it has:

- Zod-validated input and typed output.
- Authentication, role, organization ownership, and legal state-transition checks on the server.
- A safe error response that does not expose secrets or another tenant's existence.
- Idempotency or a uniqueness constraint where repeat submission could duplicate a decision.
- Audit-event creation for material workflow changes.
- At least one success test and one permission/validation failure test.

### Forbidden shortcuts

The agent must not:

- Claim Supabase, Gemini, Realtime, deployment, email, or file upload works without executing it against the configured service.
- Invent environment values, API responses, test results, user interviews, market size, or regulatory approval.
- Treat hiding a button as authorization; trust client-provided role, price, organization ID, or status; or expose the Supabase service-role/Gemini key to the browser.
- Let Gemini make a credit/funding decision, calculate offer terms, or directly write verified fields.
- Silently replace a failed live integration with mock data. Demo fallback must be visible and labelled `Demo extraction`.
- Mark a parent/phase complete because the happy-path screen looks finished.
- add email, payments, accounting integration, KYC/AML, or marketplace work before all MUST units below pass.

## 2. Fixed MVP decisions—do not redesign without user approval

- One Next.js application and one login, with role-based SME, buyer, and funder views.
- SMEs may self-register later; hackathon buyer/funder accounts are invitation-based or seeded.
- Required evidence categories: `purchase_order`, `delivery_evidence`, and `invoice`.
- Gemini extracts candidate fields. The SME reviews them. Pure TypeScript rules compare them.
- Buyer confirmation happens in the in-app portal, not by email in the core demo.
- Funding offers, acceptance, and disbursement are simulations and must say so in every relevant view.
- Supabase is the system of record; documents use private storage and time-limited signed previews.
- Synthetic data only.

## 3. Target routes and ownership

| Route | Role | Required outcome |
|---|---|---|
| `/` | Public | Product explanation and honest scope |
| `/login` | Public | Demo login and secure sign-in entry |
| `/dashboard` | All | Server-selected dashboard for current role |
| `/applications/new` | SME | Create draft, upload, review, verify, send |
| `/applications/[id]` | SME/Funder | Authorized evidence package and timeline |
| `/confirmations/[id]` | Buyer | Confirm or dispute once |
| `/offers/[id]` | SME/Funder | Create or respond to simulated terms |
| `/trust-passport` | SME | Evidence-based history; not a credit score |
| `/account` | All | Identity, organization, role, sign-out |

Unknown routes use `not-found.tsx`. Protected routes redirect unauthenticated users to `/login`; authenticated users without ownership receive a generic not-found/forbidden result without leaking record details.

## 4. Required domain contracts

### Roles and application statuses

```text
roles: sme | buyer | funder
document_types: purchase_order | delivery_evidence | invoice
application_statuses:
draft -> extracting -> review_required -> checking -> buyer_pending
buyer_pending -> buyer_confirmed | buyer_disputed
buyer_confirmed -> funder_review
funder_review -> offered | declined
offered -> accepted | offer_declined | expired
accepted -> simulated_funded
```

Only the declared forward transition is allowed. Retry may return `extracting` to `review_required`; it must not skip human review. Completed buyer and funder decisions are immutable.

### Extraction schema v1

Every field stores `value`, `normalizedValue`, `confidence`, `sourceDocumentId`, `sourceLabel`, and whether it was `userReviewed`/`userEdited`.

- Purchase order: buyer legal name, supplier legal name, PO reference, issue date, currency, order total.
- Delivery evidence: buyer legal name, supplier legal name, PO reference, delivery/completion date, receiver/signature-present indicator.
- Invoice: buyer legal name, supplier legal name, invoice number, PO reference, issue date, due date, currency, subtotal, tax, total.

Missing values are `null`; the model must never fabricate placeholders. Currency amounts are stored as integer minor units, not floating-point values.

### Verification rules v1

Each rule returns `{ ruleId, version, status, severity, title, explanation, comparedValues, sourceDocumentIds }` where status is `pass | review | fail`.

| ID | Deterministic behavior |
|---|---|
| `V001` | Normalized buyer names agree across all available documents; missing or fuzzy-only match = review, contradiction = fail. |
| `V002` | Normalized supplier names agree across documents; missing = review, contradiction = fail. |
| `V003` | PO reference agrees across PO, delivery evidence, and invoice; missing = review, contradiction = fail. |
| `V004` | Currency agrees across PO and invoice; missing = review, contradiction = fail. |
| `V005` | Invoice total equals PO total = pass; invoice below PO total = review as possible partial delivery; invoice above PO total = fail. |
| `V006` | Invoice total equals subtotal + tax within one minor currency unit; missing component = review, mismatch = fail. |
| `V007` | PO issue date is on/before delivery date and invoice issue date; missing = review, impossible order = fail. |
| `V008` | Delivery/completion date is on/before invoice issue date; missing = review, impossible order = fail. |
| `V009` | Exact SHA-256 file hash was not previously submitted; duplicate = fail. |
| `V010` | Supplier + normalized invoice number is unique; duplicate = fail. |
| `V011` | Delivery evidence indicates receipt/signature; absent or unknown = review. |
| `V012` | Buyer attestation exists; pending = review, disputed = fail, confirmed = pass. |

Overall result: any `fail` → `fail`; otherwise any `review` → `review`; otherwise `pass`. This result describes evidence consistency, never creditworthiness.

### Offer calculation

- Inputs: invoice total, advance percentage, fee percentage, expiry date.
- `advanceAmount = round(invoiceTotal × advancePercentage)` in minor units.
- `feeAmount = round(advanceAmount × feePercentage)` in minor units.
- `netDisbursement = advanceAmount - feeAmount`.
- Advance must be greater than zero and no more than invoice total; fee must be non-negative and lower than advance; expiry must be in the future.
- Store the calculated immutable amounts with the offer; never recalculate historical offers from later settings.

## 5. Dependency-ordered implementation checklist

### P0 — Repository and product contract

- [x] **P0-01 MUST** Private `Baraka-kileo/proofflow` repository exists with `main` tracking `origin/main`.
- [x] **P0-02 MUST** Scope, flows, UX, design, architecture, security, roadmap, and demo documents exist.
- [x] **P0-03 MUST** Next.js foundation is committed; local lint/typecheck/build and GitHub CI pass.
- [x] **P0-04 MUST** Root agent instructions point to this protocol and forbid unproven completion.

**P0 gate:** `git status` is clean, remote is private, CI is green, and a new contributor can state the problem, honest product promise, three roles, and demo journey.

### P1 — Tooling and reusable visual foundation

Dependencies: P0.

- [x] **P1-01 MUST — Install only approved dependencies.** Add Supabase browser/server SDK, Zod, Gemini SDK, Lucide icons, shadcn utilities/primitives, Vitest, Testing Library, and Playwright. Record exact installed packages in the log. Do not install duplicate UI/form/state libraries.
  - Accept: lockfile committed; `npm audit --omit=dev` findings reviewed; lint/typecheck/build still pass.
- [x] **P1-02 MUST — Test commands.** Configure `test:unit`, `test:e2e`, and `test` scripts; add minimal passing unit and browser smoke tests so commands are real rather than aliases.
  - Accept: each command runs independently and CI invokes lint, typecheck, unit test, and build.
- [ ] **P1-03 MUST — Tokens and primitives.** Convert design tokens from `DESIGN-SYSTEM.md` into CSS variables; create Button, Card, Badge/StatusBadge, Input, Select, Checkbox, Dialog/Sheet, Progress, Alert, Skeleton, Toast, Tooltip, and accessible FormField primitives.
  - Files: `src/app/globals.css`, `src/components/ui/*`, `src/components/status-badge.tsx`, `src/components/error-summary.tsx`.
  - Accept: components expose typed variants; no copied color values inside feature pages; focus/reduced-motion states proven in browser.
- [ ] **P1-04 MUST — App shell.** Create protected layout, responsive desktop rail, tablet/mobile navigation, organization/role context, skip link, and main content landmark.
  - Files: `src/app/(protected)/layout.tsx`, `src/components/app-shell.tsx`, `src/components/navigation.tsx`.
  - Accept: correct navigation list for each role; active route announced; 390/768/1440 layouts have no overflow.
- [ ] **P1-05 MUST — Global route states.** Implement root/protected loading skeletons, error recovery, not-found, empty-state, and offline/retry patterns.
  - Accept: manually force each state; no dead recovery button; status changes use `aria-live`.
- [ ] **P1-06 MUST — Login UI.** Build `/login` with normal sign-in form, validation, safe generic errors, show/hide password control, and clearly labelled demo-role quick-fill controls.
  - Accept: keyboard-only completion works; buyer/funder public registration is absent; no credentials are hard-coded into client source.
- [ ] **P1-07 MUST — Role dashboards.** Implement `sme-dashboard.tsx`, `buyer-dashboard.tsx`, and `funder-dashboard.tsx` using a temporary typed repository adapter until P2 is live.
  - Accept: each dashboard has one dominant next action, accurate empty/loading/error states, and no enabled action pointing to a missing route.

**P1 gate:** `npm run lint && npm run typecheck && npm run test:unit && npm run build`; visual inspection at all three widths; zero console errors. Do not check P1 complete merely because the public landing page exists.

### P2 — Database, storage, authentication, and tenant isolation

Dependencies: P1-01, P1-02, P1-04, P1-06.

- [ ] **P2-01 MUST — Environment validation.** Create a server-only environment schema for the four public/server variables in `.env.example`; application fails with a helpful server message when required live-mode values are missing.
  - Accept: secrets are never prefixed `NEXT_PUBLIC_`; `.env.local` is ignored; client bundle inspection finds no server keys.
- [ ] **P2-02 MUST — Initial schema.** Migration creates enums/tables for profiles, organizations, memberships, applications, documents, document_fields, verification_runs, verification_checks, confirmations, offers, and audit_events.
  - Required columns: UUID primary keys, ownership foreign keys, status/type enums, created/updated timestamps; money as bigint minor units; percentages as bounded integer basis points; unique constraints for membership, document slot, decision, offer response, and invoice identity.
  - Accept: clean local/remote migration applies twice safely through reset/recreate workflow; generated TypeScript database types are saved.
- [ ] **P2-03 MUST — Private storage.** Create private `application-documents` bucket and path convention `{organizationId}/{applicationId}/{documentId}/{safeFilename}`.
  - Accept: anonymous/public URL fails; authorized signed preview expires; type/size/path constraints are enforced.
- [ ] **P2-04 MUST — RLS policies.** Enable RLS on every business table. SME sees/changes its organization's allowed drafts; buyer sees only confirmation requests addressed to its organization; funder sees only buyer-confirmed/review records allowed to funder; audit/check facts cannot be rewritten by ordinary clients.
  - Accept: automated two-tenant tests prove allowed access succeeds and ID substitution fails for select/insert/update/delete.
- [ ] **P2-05 MUST — Authentication helpers.** Implement browser/server Supabase clients, `getUser`, `requireUser`, `requireRole`, `requireApplicationAccess`, and sign-out. Follow installed Next.js proxy/session documentation rather than memory.
  - Accept: protected route redirects when signed out; wrong role/tenant returns generic denial; authorization is repeated in mutation handlers.
- [ ] **P2-06 MUST — Seed data.** Seed fictional SME, buyer, funder organizations and profiles plus a documented safe method to create demo auth users outside committed SQL secrets.
  - Accept: seed can be rerun; names/data say “Demo”; no real email, identity, bank, or customer information is committed.
- [ ] **P2-07 MUST — Replace temporary dashboard repository.** Dashboards load typed server data from Supabase while preserving loading/empty/error presentation.
  - Accept: each demo role receives only its own queue and metrics.

**P2 gate:** migration/seed reproducible, RLS isolation tests green, three-role sign-in proven in separate browser sessions, and no secret appears in Git history or browser output.

### P3 — SME draft and secure document upload

Dependencies: P2.

- [ ] **P3-01 MUST — Create draft.** `/applications/new` business step collects buyer organization, PO reference, invoice number, invoice amount/currency, expected due date, and consent to AI processing.
  - Accept: server creates only an SME-owned `draft`; invalid buyer/amount/date or missing consent returns field messages plus linked error summary.
- [ ] **P3-02 MUST — Guided task layout.** Implement five-step task list: Details → Documents → Review → Verification → Buyer. Persist current completed step from server data, not local animation state.
  - Accept: refresh/back preserves progress; locked steps explain prerequisites.
- [ ] **P3-03 MUST — Three upload slots.** Each document type has one named slot with purpose/help, drag/drop and browse, PDF/JPEG/PNG allowlist, configured maximum size, filename sanitization, upload progress, cancel/retry/remove, and preview.
  - Accept: wrong type, too large, duplicate slot, interruption, removal, and successful upload are tested; no public object URL.
- [ ] **P3-04 MUST — Hash and exact duplicate.** Calculate SHA-256 in a trusted server workflow, save it, and reject an existing exact hash before extraction.
  - Accept: re-uploading the same bytes under a different filename produces `V009 fail`; another tenant's hash does not leak its identity/details.
- [ ] **P3-05 MUST — Draft recovery.** Reopening `/applications/[id]` returns the user to the first incomplete step with saved files and values.
  - Accept: reload and sign-out/sign-in recovery proven; deleted/failed uploads are not shown as complete.

**P3 gate:** SME can create and recover a draft and privately upload all three synthetic evidence categories; all named failure paths recover without data loss.

### P4 — Gemini extraction and mandatory human review

Dependencies: P3.

- [ ] **P4-01 MUST — Extraction schema/prompt.** Define Zod schemas for Extraction v1 and one fixed prompt per document category. Prompt says document instructions are untrusted data, missing values must be null, and output must match schema.
  - Accept: schema fixtures cover complete, missing, malformed, and adversarial document text.
- [ ] **P4-02 MUST — Server Gemini adapter.** Upload/read the private document server-side, call the configured Gemini Flash model with structured output, use bounded timeout/retry, validate response, and save raw provider metadata plus normalized fields.
  - Accept: API key never reaches browser/log; invalid model output is rejected; retry does not create duplicate field sets.
- [ ] **P4-03 MUST — Honest demo fallback.** Create deterministic extraction fixtures keyed only to bundled synthetic sample documents. Activate only through an explicit demo configuration and display `Demo extraction—not processed by live AI`.
  - Accept: fallback cannot silently activate after a live failure; unknown documents do not receive invented fixture values.
- [ ] **P4-04 MUST — Review UI.** Show signed document preview and editable extracted fields together. Mark low-confidence/missing fields `Please check`; show source category; preserve original and edited value.
  - Accept: every material v1 field can be reviewed; money/date normalization is visible; mobile can switch preview/fields without losing edits.
- [ ] **P4-05 MUST — Review submission.** Server validates completeness/ownership, writes reviewed fields and audit event, then allows checking. AI cannot mark `userReviewed`.
  - Accept: verification endpoint rejects unreviewed fields; repeat save is idempotent; edit provenance is displayed.

**P4 gate:** live extraction is proven with a synthetic file or explicitly documented as blocked; fallback is honest; malformed AI output never reaches verification; SME can correct and approve the complete record.

### P5 — Deterministic verification report

Dependencies: P4.

- [ ] **P5-01 MUST — Normalizers.** Implement pure normalization for names, references, ISO dates, currency codes, and integer minor units. Do not use locale-dependent floating-point parsing for stored money.
  - Accept: table-driven unit tests cover punctuation/case/whitespace, invalid dates, decimal currencies, and null values.
- [ ] **P5-02 MUST — Rules V001–V012.** Implement each table rule as a pure typed function with no database/AI/network access.
  - Accept: every rule has pass/review/fail fixtures where logically applicable and returns source IDs/compared values/explanation.
- [ ] **P5-03 MUST — Orchestrator/versioning.** Run a frozen rule version over reviewed fields/hashes and persist one run with its checks and overall result transactionally.
  - Accept: rerun creates an auditable new version/run without rewriting old results; partial database failure writes nothing.
- [ ] **P5-04 MUST — Duplicate invoice identity.** Query by supplier organization + normalized invoice number; protect with database uniqueness as well as UI warning.
  - Accept: same invoice number for another supplier is allowed; same supplier duplicate fails without exposing the other application.
- [ ] **P5-05 MUST — Verification UI.** `/applications/[id]` shows overall evidence-consistency result, each check, compared values, explanations, document sources, next action, and audit timeline.
  - Accept: status never says `approved for finance`; color is paired with icon/text; loading/empty/failure/rerun states work.
- [ ] **P5-06 MUST — Send to buyer.** Only a reviewed application with a completed check run may transition to `buyer_pending`; create one confirmation request and audit event.
  - Accept: repeated submit cannot create multiple requests; failed checks remain visible and policy for sending a failed pack is explicit (MVP: blocked until corrected/rerun).

**P5 gate:** deterministic test suite is green; valid fixture is pass/review as designed; mismatch and duplicate fixtures fail; every displayed claim links back to compared values.

### P6 — Buyer confirmation portal

Dependencies: P5.

- [ ] **P6-01 MUST — Buyer queue.** Buyer dashboard loads only `buyer_pending` requests for its organization, ordered oldest first, with supplier, invoice reference, amount, submitted time, and warning count.
  - Accept: empty/loading/error states and pluralization work; second buyer organization cannot see the queue.
- [ ] **P6-02 MUST — Confirmation detail.** `/confirmations/[id]` shows supplier, PO/invoice/total/due date, delivery preview, verification warnings, and three attestations: order recognized, delivery received, amount/reference recognized.
  - Accept: preview signed URL is authorized/expiring; buyer cannot edit SME fields; mobile and keyboard flow pass.
- [ ] **P6-03 MUST — Confirm.** Server requires buyer ownership, all attestations, pending status, and one-decision uniqueness; writes confirmation, `buyer_confirmed`, V012 rerun/update, and audit event transactionally.
  - Accept: double-click/replay produces one decision; SME sees status after refresh and via Realtime if configured.
- [ ] **P6-04 MUST — Dispute.** Dialog requires a meaningful reason, confirms destructive intent, and writes immutable `buyer_disputed` plus audit event.
  - Accept: blank/short reason rejected; SME sees reason safely; funder cannot offer on disputed package.
- [ ] **P6-05 MUST — Receipt/history.** Completed action is read-only with actor organization, decision, timestamp, attestations/reason, and request/application references.
  - Accept: no edit/re-submit controls remain; browser back/refresh does not reopen action.

**P6 gate:** two-browser SME→buyer handoff succeeds, dispute alternative is proven, repeat/wrong-tenant actions fail, and receipts are immutable.

### P7 — Funder review and simulated offer

Dependencies: P6 confirmed path.

- [ ] **P7-01 MUST — Funder queue.** Show only buyer-confirmed/funder-review applications available to the seeded funder with evidence status, amount, due date, buyer confirmation time, and warning count.
  - Accept: unconfirmed/disputed packages absent; wrong role/tenant denied.
- [ ] **P7-02 MUST — Evidence review.** Funder application view is read-only and includes original previews, reviewed fields, V001–V012 results, buyer receipt, duplicates, and audit timeline.
  - Accept: funder cannot modify SME evidence or buyer decision; every warning is explainable.
- [ ] **P7-03 MUST — Offer form/calculation.** Collect advance percentage, fee percentage, and expiry; calculate/show invoice, gross advance, fee, net disbursement, and due date using the fixed contract above.
  - Accept: boundary and rounding unit tests pass; invalid/negative/excess amounts and past expiry fail server validation.
- [ ] **P7-04 MUST — Offer or decline.** Authorized funder creates one immutable simulated offer or records a decline reason; application status and audit event update transactionally.
  - Accept: all relevant UI says `Simulated offer`; retries/double submits are idempotent; terms cannot be changed after issue.
- [ ] **P7-05 MUST — SME response.** SME sees a plain-language term summary and accepts or declines once in a confirmation dialog.
  - Accept: accepted → `accepted` then explicit demo action/status `simulated_funded`; declined → `offer_declined`; expired offers cannot be accepted.

**P7 gate:** funder review→offer→SME acceptance works end-to-end; calculations match tests; nothing implies a real credit approval, contract, payment, or ABSA endorsement.

### P8 — Trust Passport

Dependencies: P7.

- [ ] **P8-01 MUST — Server metrics.** Calculate from immutable completed events: confirmed application count, disputed count, verified invoice value, distinct confirming buyers, and dated history.
  - Accept: draft/pending/other-tenant data excluded; money values aggregate in minor units with currency grouping.
- [ ] **P8-02 MUST — Passport UI.** `/trust-passport` explains each metric, links to its source application/receipt, shows an evidence timeline, and states `This is not a credit score or funding guarantee.`
  - Accept: zero-history and populated states work; no opaque score/gauge or AI-generated rating.
- [ ] **P8-03 MUST — Update proof.** Completing the seeded happy path visibly adds its evidence without manual database editing.
  - Accept: refresh/realtime result agrees with database query; another SME's event cannot affect it.

**P8 gate:** passport is explainable, tenant-isolated, and derived exclusively from completed evidence.

### P9 — Synthetic documents, resilience, and experience polish

Dependencies: P3–P8 surfaces.

- [ ] **P9-01 MUST — Sample packs.** Add synthetic `valid`, `mismatch`, and `duplicate` PDF/image sets with obvious demo branding and matching expected extraction JSON.
  - Accept: no real identities/logos/bank data; expected rule outcomes documented and proven.
- [ ] **P9-02 MUST — Complete UI state audit.** Use the route/state matrix in `UX-SPEC.md`; verify every page's loading, empty, error, success, disabled, and permission states.
  - Accept: results recorded route by route in implementation log; no dead controls or placeholder copy.
- [ ] **P9-03 MUST — Responsive audit.** Test 390×844, 768×1024, and 1440×900 for every core route.
  - Accept: no horizontal overflow/clipped dialogs; sticky actions do not cover content; document review remains usable.
- [ ] **P9-04 MUST — Accessibility audit.** Test keyboard-only completion, focus restoration in dialogs, heading/landmark structure, persistent labels, error summary links, status live regions, contrast, touch size, and 200% zoom.
  - Accept: all critical-path blockers fixed; remaining non-blocking limitations logged.
- [ ] **P9-05 MUST — Motion/performance.** Add only purposeful state transitions; honor reduced motion; stabilize skeleton dimensions; optimize fonts/assets and avoid unnecessary client components.
  - Accept: action feedback begins immediately; no long/looping ornament; no visible layout shifts on core pages.
- [ ] **P9-06 MUST — Failure rehearsal.** Simulate Gemini timeout/malformed response, upload failure, expired signed link, duplicate submission, stale status, offline/slow network, and database denial.
  - Accept: user receives a safe explanation and recovery action; no corruption or cross-tenant detail leak.

**P9 gate:** a first-time user can complete each role's job on mobile without verbal coaching, and failures are recoverable.

### P10 — Final verification, deployment, and judging evidence

Dependencies: all MUST units P1–P9.

- [ ] **P10-01 MUST — Automated suite.** Unit tests cover normalization, V001–V012, offer math, validation, and state transitions; integration/policy tests cover roles; browser smoke covers the critical flow.
  - Accept: tests fail when a representative rule/permission is intentionally broken, then pass after restoration.
- [ ] **P10-02 MUST — CI gate.** GitHub Actions runs clean install, lint, typecheck, unit tests, and production build on push/PR.
  - Accept: latest `main` run green; no skipped required test or ignored failure.
- [ ] **P10-03 MUST — Security release review.** Check dependency audit, secrets/history, RLS/storage, server-key boundaries, upload validation, signed-link expiry, log redaction, and disclosure text.
  - Accept: findings fixed or explicitly logged as production gaps; no high-severity known issue left in demo path.
- [ ] **P10-04 MUST — Deploy.** Configure Vercel environment values without committing them; deploy; apply production schema/policies; validate auth callback/origin and all three roles on deployed URL.
  - Accept: deployment survives refresh/deep link; no local-only dependency; live health check and core flow pass.
- [ ] **P10-05 MUST — Four-minute rehearsal.** Follow `DEMO-SCRIPT.md` using separate SME/buyer/funder sessions, including one explainable warning and Trust Passport update.
  - Accept: three consecutive rehearsals finish under four minutes; backup seeded state/fallback procedure works.
- [ ] **P10-06 MUST — Judging evidence.** Update README with deployed link, screenshots, architecture summary, demo steps, honest limitations, and explicit evidence for all six criteria.
  - Accept: innovation, implementation, tools/ethics, security/privacy, business model, and scalability/interoperability each point to a working feature or document.
- [ ] **P10-07 MUST — Final repository state.** Remove debug output/dead code; confirm licenses/attribution; clean Git state; tag the demonstrated commit.
  - Accept: `npm run lint && npm run typecheck && npm run test:unit && npm run build` pass locally and on CI; deployed commit equals tagged commit.

## 6. Stop conditions and blocker behavior

Stop and ask the user only when a missing choice would materially change scope, or when external authority is required, such as creating/providing Supabase, Gemini, or Vercel credentials. Do not ask for choices already fixed in this document.

If an external service is unavailable:

1. Finish safe local adapter/UI/test work that does not require claiming the integration works.
2. Leave the live-integration work unit unchecked.
3. Add a blocker entry to `IMPLEMENTATION-LOG.md` with the exact missing requirement and the next verification command/action.
4. Use the explicit demo fallback only where defined; do not widen fallback behavior.

## 7. Final completion statement

The AI may say **“ProofFlow MVP is complete”** only when every MUST checkbox in P1–P10 is checked, every phase gate has evidence in `IMPLEMENTATION-LOG.md`, the deployed critical path succeeds, the current GitHub CI run is green, and all simulations/production gaps are disclosed. Otherwise it must say exactly which phase is active and what remains.
