# AI build checklist

This file is the source of truth for delivery. Complete phases in order. Check a box only when its acceptance line is true; if a check fails, leave it open and record the blocker beneath the item.

## P0 — Scope and repository

- [x] Private GitHub repository created and local `main` initialized.
- [x] Product scope, user flows, UX, design, architecture, security, demo, and roadmap documented.
- [x] First commit passes lint and build and is pushed to `origin/main`.

**Gate:** A new contributor can explain the user, problem, demo, limits, and definition of done from the repository alone.

## P1 — Foundation and visual system

- [ ] Install/configure shadcn/ui primitives, icons, validation, testing, Supabase, and AI dependencies.
- [ ] Implement tokens, typography, focus styles, reduced-motion behavior, toast/alert patterns, and reusable status components.
- [ ] Build responsive role-aware app shell, desktop rail, mobile navigation, page heading, loading/error/empty states.
- [ ] Build polished sign-in and three dashboard variants with synthetic data.

**Gate:** At 390px, 768px, and 1440px there is no horizontal overflow; keyboard/focus works; visual states match `DESIGN-SYSTEM.md`; `npm run build` passes.

## P2 — Data, auth, and access control

- [ ] Create schema, enums, constraints, indexes, timestamps, and audit model.
- [ ] Create RLS/storage policies for SME, buyer, and funder boundaries.
- [ ] Implement sign-in, session handling, role-aware redirects, server authorization, and sign-out.
- [ ] Seed one organization/account per role without real personal data.
- [ ] Prove cross-organization reads/writes fail in policy tests.

**Gate:** Each demo role sees only its permitted records; changing a URL or request ID cannot bypass access rules.

## P3 — SME application and upload

- [ ] Implement application draft/business-details step with Zod validation.
- [ ] Implement three named upload slots with type/size/count validation and private storage.
- [ ] Add per-file upload/progress/retry/remove/preview states and SHA-256 hash.
- [ ] Block exact duplicate documents and flag normalized invoice-reference duplicates.
- [ ] Persist/recover a partially completed draft.

**Gate:** A synthetic PO, delivery note, and invoice upload successfully; invalid/duplicate files receive useful recovery messages.

## P4 — Extraction and review

- [ ] Define versioned structured extraction schema and prompt for each document class.
- [ ] Implement Gemini extraction behind a server-only boundary with timeout/error/retry handling.
- [ ] Validate/normalize model output and store provenance/confidence.
- [ ] Build preview + editable field-review experience with low-confidence warnings.
- [ ] Provide clearly labelled deterministic demo fallback when AI is unavailable.

**Gate:** No unvalidated AI value reaches verification; a user can correct every material field and see what was changed.

## P5 — Explainable verification

- [ ] Implement pure rules for parties, PO/reference, invoice number, currency, totals, dates, delivery, and duplicates.
- [ ] Return pass/review/fail, compared values, rule version, and plain-language reason.
- [ ] Persist runs/checks and build evidence report plus timeline.
- [ ] Unit-test exact match, normalized match, tolerance, missing field, mismatch, and duplicate cases.

**Gate:** The same inputs always produce the same result and every displayed result is traceable to source values.

## P6 — Buyer confirmation

- [ ] Build buyer queue ordered by pending age.
- [ ] Build confirmation page with evidence preview and explicit attestations.
- [ ] Implement one-time idempotent confirm/dispute mutation with required dispute reason.
- [ ] Create audit receipt and update SME status without refresh where practical.

**Gate:** Buyer action is visible to the SME and cannot be edited, repeated, or performed by another organization.

## P7 — Funder review and offer

- [ ] Build buyer-confirmed application queue and evidence detail view.
- [ ] Build transparent simulated-offer form with amount/fee/net/date validation.
- [ ] Implement offer/decline, immutable terms, expiry, and audit event.
- [ ] Build SME offer summary and idempotent accept/decline flow.

**Gate:** Calculations are correct and labelled; only an authorized funder can offer; no screen implies real approval or disbursement.

## P8 — Trust Passport

- [ ] Build evidence-based metrics and history from completed workflow events.
- [ ] Explain what each metric means and explicitly state it is not a credit score.
- [ ] Verify one organization's evidence never affects another's profile.

**Gate:** Completing the happy path produces a visible, explainable passport update.

## P9 — Polish and resilience

- [ ] Complete hover/focus/pressed/disabled/loading/empty/error/success states.
- [ ] Add purposeful page, upload, check, dialog, and timeline motion with reduced-motion fallback.
- [ ] Test keyboard, screen-reader labels/live regions, contrast, 200% zoom, and touch sizes.
- [ ] Test mobile/tablet/desktop and slow/failing network recovery.
- [ ] Remove dead controls, placeholder copy, console errors, and accidental horizontal scrolling.

**Gate:** The product remains understandable when empty, slow, failed, complete, or used without a mouse.

## P10 — Verification and delivery

- [ ] Add unit tests, critical happy-path browser test, and CI workflow.
- [ ] Run lint, typecheck, unit tests, e2e smoke, production build, and dependency/security review.
- [ ] Prepare valid, mismatch, and duplicate synthetic document sets.
- [ ] Deploy to Vercel with production environment values and verify RLS/storage policies.
- [ ] Rehearse the four-minute demo and document demo accounts/fallback without committing credentials.
- [ ] Capture final screenshots and map evidence to all six judging criteria.

**Final gate:** A fresh browser can complete SME upload → checks → buyer confirmation → funder offer → SME acceptance, and the team can explain security, business viability, scalability, and production gaps honestly.
