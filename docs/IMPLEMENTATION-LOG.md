# Implementation evidence log

This is an append-only record of proof for completed checklist units. Do not erase failed checks; add the fix and rerun result beneath them. Never include credentials, tokens, personal data, or confidential document contents.

## Entry template

```text
Date/time:
Agent/person:
Work unit IDs:
Outcome:
Changed files:
Automated checks and exact result:
Manual/browser checks and viewport:
Security/tenant checks:
Assumptions or demo-only behavior:
Remaining risks/blockers:
Commit/CI link:
```

## 2026-09-05 — P0 foundation

- **Work unit IDs:** P0-01, P0-02, P0-03, P0-04
- **Outcome:** Created private GitHub repository, product documentation, agent delivery rules, Next.js 16 foundation, initial ProofFlow landing experience, and CI.
- **Changed areas:** root configuration, `src/app`, `docs`, `.github/workflows/ci.yml`.
- **Automated evidence:** `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` passed locally. GitHub CI run `33924461681` passed clean install, lint, typecheck, and build on commit `a13de82`.
- **Manual evidence:** Landing page inspected at desktop and 375px-wide mobile. Mobile `scrollWidth` equalled `clientWidth`; no console warnings/errors were observed. Motion settled correctly and reduced-motion CSS is present.
- **Security/demo boundary:** Repository is private. `.env.local`/`.env*` are ignored except the empty `.env.example`. Landing copy states no real money moves.
- **Remaining:** P1 and later application functionality is not implemented. The landing page alone is not evidence that the role portals work.

## 2026-09-05 — P1-01 approved dependencies

- **Work unit IDs:** P1-01
- **Outcome:** Installed the approved Supabase, Gemini, Zod, Lucide, Radix/shadcn utility, toast, Vitest, Testing Library, and Playwright dependencies without adding a second form, state, or UI system.
- **Changed files:** `package.json`, `package-lock.json`.
- **Automated evidence:** `npm audit --omit=dev` reported zero vulnerabilities. `npm run lint`, `npm run typecheck`, and `npm run build` passed with Next.js 16.3.4 and Node 24.
- **Assumptions:** Packages are installed but external Supabase/Gemini services are not configured or claimed working.
- **Remaining:** P1-02 must replace the temporary `test` alias with genuine unit and browser smoke test commands.

## 2026-09-05 — P1-02 real test harness

- **Work unit IDs:** P1-02
- **Outcome:** Configured genuine Vitest/jsdom unit testing and Playwright Chromium browser testing; CI now executes unit tests.
- **Changed files:** `package.json`, `package-lock.json`, `vitest.config.mts`, `playwright.config.ts`, `tests/setup.ts`, `tests/unit/landing-page.test.tsx`, `tests/e2e/landing.spec.ts`, `.github/workflows/ci.yml`.
- **Automated evidence:** lint and typecheck passed; Vitest ran one semantic landing test; Playwright ran one 390px landing/overflow test in Chromium. Both passed without configuration or server warnings after cleanup.
- **Manual/browser scope:** Playwright asserts the product heading, simulation boundary, and exact mobile scroll width.
- **Remaining:** This is a harness, not coverage of unbuilt role workflows. Feature tests must be added with each later unit.

## 2026-09-05 — P1-03 design tokens and primitives

- **Work unit IDs:** P1-03
- **Outcome:** Added typed ProofFlow Button, Card, StatusBadge, Input, Select, Checkbox, Dialog, Progress, Alert, Skeleton, Toast, Tooltip, FormField, ErrorSummary, and class-merging utilities; expanded the documented color/motion tokens.
- **Changed areas:** `src/components/ui`, `src/components/status-badge.tsx`, `src/components/error-summary.tsx`, `src/lib/utils.ts`, root layout/global CSS, landing page.
- **Automated evidence:** lint, typecheck, production build, and five unit assertions passed. Two Chromium tests passed at 390px, including zero horizontal overflow, visible keyboard focus, and reduced animation duration when reduced motion is requested.
- **Manual/UI boundary:** The landing evidence status now uses the shared StatusBadge. Feature forms will exercise the remaining primitives in P1-04 through P1-07.
- **Remaining:** App shell, route states, login, and role dashboards are not implemented yet.

## 2026-09-05 — P1-04 responsive role shell

- **Work unit IDs:** P1-04
- **Outcome:** Added a typed demo-session DTO, protected route group, desktop rail, tablet/mobile bottom navigation, organization/role context, skip link, top bar, and main content landmark.
- **Changed areas:** `src/app/(protected)`, `src/components/app-shell.tsx`, `src/components/navigation.tsx`, `src/components/logo.tsx`, `src/lib/demo/session.ts`, `src/types/domain.ts`, global CSS.
- **Automated evidence:** lint/typecheck passed; eight unit assertions passed including exact SME/buyer/funder navigation; five Chromium checks passed including shell widths 390, 768, and 1440 with `scrollWidth === clientWidth`.
- **Security/demo boundary:** The adapter is named and labelled demo-only. It is not represented as authentication; P2 must replace it with Supabase/DAL authorization.
- **Remaining:** Unbuilt destinations are exposed as non-interactive `aria-disabled` items rather than dead links. They become links only when their routes are implemented.

## 2026-09-05 — P1-05 global route states

- **Work unit IDs:** P1-05
- **Outcome:** Implemented geometry-stable loading skeletons, executable error reset, not-found recovery, reusable empty state, and online/offline recovery banner in root/protected boundaries.
- **Changed areas:** root/protected `loading.tsx` and `error.tsx`, `not-found.tsx`, route-loading/error, empty-state, connection-status, app shell.
- **Automated evidence:** eleven unit assertions passed, including loading announcement, functional reset callback, and valid empty-state action. Six Chromium tests passed, including forced 404 and offline states with visible recovery.
- **Accessibility evidence:** loading uses a named live status; failures use alert semantics; the offline alert announces assertively; recovery controls are keyboard-native.
- **Remaining:** Feature-specific empty/error states must still be implemented with their feature routes.

## 2026-09-05 — P1-06 honest login and demo roles

- **Work unit IDs:** P1-06
- **Outcome:** Built responsive split login, persistent labelled fields, Zod validation, linked error summary, password visibility control, generic live-auth unavailable notice, and validated demo-role entry.
- **Changed areas:** `/login`, login feature/schema/server action, demo session adapter, login layout CSS, root scroll behavior marker.
- **Automated evidence:** thirteen unit assertions passed, including invalid/valid login behavior and password toggle. Seven Chromium tests passed; buyer demo entry redirected to `/dashboard`, rendered buyer context, and set an HTTP-only cookie.
- **Security/demo boundary:** The role cookie is HTTP-only, same-site lax, secure in production, validated against a fixed enum, and explicitly a demo adapter—not production authorization. No demo passwords are embedded.
- **Remaining:** Supabase authentication/server authorization belongs to P2. Live sign-in clearly says it is not connected.

## 2026-09-05 — P1-07 role dashboards and Phase 1 gate

- **Work unit IDs:** P1-07; Phase 1 gate
- **Outcome:** Built distinct SME, buyer, and funder dashboards over a typed server-only demo repository. SME sees evidence progress; buyer sees age-ordered confirmations; funder sees buyer-confirmed evidence and simulated-offer context.
- **Changed areas:** dashboard page/features, typed demo repository, shared metric/queue presentation, page heading, login/session-aware dashboard test.
- **Automated evidence:** lint, typecheck, unit tests, browser suite, and production build passed. Chromium proved all three role selections land on distinct H1/next-task dashboards. Required 390/768/1440 overflow checks pass.
- **Manual visual evidence:** Inspected login and SME dashboard in the in-app browser. Fixed explicit logo and active-navigation contrast; computed colors are white on dark green. Final console warning/error log was empty.
- **Interaction boundary:** Workflow actions whose routes are scheduled for P3/P6/P7 are real disabled buttons with explanations, not dead links. Nav destinations remain disabled until implemented.
- **Security/demo boundary:** Dashboard data comes from a named server-only demo adapter. No claim of live Supabase isolation is made.
- **Remaining:** P2 requires credentials for live Supabase proof. No P2 unit is checked.

## 2026-09-05 — P2-01 hosted environment boundary

- **Work unit IDs:** P2-01
- **Outcome:** Linked the repository to the healthy hosted ProofFlow Supabase project and added a server-only Zod environment boundary with separate fail-fast checks for live Supabase, privileged Supabase admin, and Gemini extraction workflows. `.env.local` and Supabase CLI link/cache state remain ignored.
- **Changed areas:** `.env.example`, `.gitignore`, `src/lib/env/server.ts`, environment tests, test-only server boundary alias, Supabase CLI project configuration.
- **Failed check retained:** The first unit-test run could not resolve `server-only`. After installing the official boundary package, the second run correctly threw its browser-side guard under jsdom. Vitest now substitutes an explicit no-op only inside tests while production builds retain the real Next.js boundary.
- **Automated evidence:** Final lint and typecheck passed. Six Vitest files with 16 assertions passed, including missing-live-value errors and server-secret guards. The Next.js production build passed. A recursive scan of `.next/static` found neither `SUPABASE_SERVICE_ROLE_KEY` nor `GEMINI_API_KEY` variable names.
- **Security boundary:** No API key, access token, database password, or service-role value was printed, committed, or placed in a public variable. The public Supabase URL/publishable key will be configured separately from server-only secrets.
- **Assumptions:** The current UI may remain in its explicitly labelled demo adapter until P2-07. Live-only helpers fail with actionable configuration errors when invoked without their values.
- **Remaining:** Database schema, storage, RLS, auth helpers, safe seed users, and live dashboard repository remain P2 work.

## 2026-09-05 — P2-02 hosted initial schema

- **Work unit IDs:** P2-02
- **Outcome:** Applied the initial ProofFlow schema to the linked hosted project. It includes every required table and domain enum, UUID ownership chains, timestamps, integer minor-unit money, bounded basis points, and uniqueness for membership, evidence slots, confirmation decisions, funder offers/responses, invoice identity, and document hashes.
- **Changed areas:** `supabase/migrations/20260905020000_initial_schema.sql`, `src/types/database.ts`.
- **Hosted migration evidence:** A dry run listed exactly one pending migration and linked database lint returned no errors. The first hosted push applied migration `20260905020000`; an immediate second push returned `upToDate: true` with zero migrations. Local and remote migration histories match.
- **Type evidence:** Supabase-generated TypeScript database types were saved and compared byte-normalized with a fresh hosted generation; they match exactly. Application lint and typecheck pass, and a final hosted database lint reports no schema errors.
- **Security boundary:** Every new business table had RLS enabled in the initial migration before client access. With no policies yet, browser clients are denied by default. No local Supabase service was started.
- **User-directed deviation:** The checklist's local reset wording was replaced by hosted dry-run, apply, immediate no-op reapply, linked history comparison, and hosted lint because the user explicitly requested online Supabase only. No hosted database reset was performed.
- **Remaining:** P2-03 private storage and signed-preview controls are next; role policies and two-tenant proof follow in P2-04.

## 2026-09-05 — P2-03 hosted private document vault

- **Work unit IDs:** P2-03
- **Outcome:** Created the private `application-documents` hosted bucket with a 10 MiB ceiling, PDF/JPEG/PNG allowlist, safe-filename rule, exact organization/application/document/filename path ownership, and role-aware read/write policies. SMEs can change evidence only before review advances; buyers and funders gain read-only evidence access only at eligible workflow states.
- **Changed areas:** `supabase/migrations/20260905023000_private_document_storage.sql`, `tests/integration/storage-security.mjs`.
- **Failed check retained:** The first hosted test attempted Supabase's newer secret-key format, which the installed Auth admin client rejected as an invalid API key. The runner was switched to the project's legacy service-role key without displaying or persisting either credential.
- **Hosted evidence:** Migration dry-run and apply passed; linked database lint reports zero errors. The experimental CLI storage listing returned `application-documents/`. A synthetic authenticated SME uploaded a valid PDF, while a public URL failed. A one-second signed preview loaded while valid and failed after expiry. Malformed paths, `text/plain`, and a 10 MiB + 1 byte upload were each rejected.
- **Cleanup evidence:** The integration probe removes its object, application, organization, profile/auth user and also removes exact-name stale probe records from interrupted prior runs. A second complete run passed with cleanup in place.
- **Security boundary:** Credentials are obtained transiently from the authenticated CLI, injected only into the test process, and never displayed, written to a file, or committed. All test identities use randomized `example.invalid` addresses and Demo-labelled data.
- **Remaining:** P2-04 must define and prove table-level role/tenant policies across select, insert, update, and delete.
