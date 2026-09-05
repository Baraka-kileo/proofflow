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

## 2026-09-05 — P2-04 hosted tenant isolation

- **Work unit IDs:** P2-04
- **Outcome:** Added server-enforced role/organization helpers and explicit RLS policies for all eleven business tables. SMEs can read their own tenant and mutate only editable drafts; buyers see and decide only requests addressed to their organization; funders see only buyer-confirmed or later packages; verification checks and audit events expose no ordinary-client write policy.
- **Changed areas:** `supabase/migrations/20260905031500_tenant_rls_policies.sql`, `supabase/migrations/20260905032000_nullable_identity_constraints.sql`, `tests/integration/rls-two-tenant.mjs`, regenerated `src/types/database.ts`.
- **Schema correction:** Pre-test review found the initial `NULLS NOT DISTINCT` constraints would permit only one no-registration organization per kind and one no-invoice draft per owner/buyer pair. A corrective hosted migration replaced them with partial unique indexes that enforce identity only when the identifying value exists.
- **Failed checks retained:** The first policy run used an already occupied invoice document slot; the test now uses the purchase-order slot. The second expected a denied update to return an error, while PostgREST safely returned zero affected rows; the final assertion now proves zero rows changed and independently verifies the stored check remains unchanged. The nullable-constraint migration initially used an assumed/truncated generated constraint name twice; it was replaced by catalog lookup and then applied successfully.
- **Hosted evidence:** Both policy and constraint migrations applied successfully and linked database lint reports zero errors. The final randomized two-tenant suite passed twice from clean synthetic users. It proves own-tenant select/insert/update/delete succeeds, cross-tenant ID substitution returns no rows or a policy violation, addressed buyers cannot view/decide another buyer's request, funders cannot view draft or buyer-pending packages, and ordinary users cannot rewrite/delete verification facts or fabricate audit events.
- **Cleanup/security:** Every run deletes its applications, organizations, profiles, and randomized `example.invalid` auth users. Project credentials are injected transiently from the authenticated CLI and are never displayed, persisted, or committed. Fresh generated TypeScript types exactly match the hosted schema.
- **Remaining:** P2-05 authentication clients and server authorization helpers are next.

## 2026-09-05 — P2-05 hosted authentication and authorization helpers

- **Work unit IDs:** P2-05
- **Outcome:** Replaced the fake role cookie with Supabase SSR browser/server clients, Next.js request proxy refresh, verified-user lookup, role and tenant DAL guards, live credential sign-in, hosted one-click Demo sign-in, and sign-out. Protected layouts repeat the server role check after the optimistic proxy check; application access is looked up through RLS and invalid/wrong-tenant IDs receive the same not-found response.
- **Changed areas:** `src/lib/supabase`, `src/lib/auth`, `src/proxy.ts`, protected layout/dashboard, login action/form, app shell, browser tests.
- **Documentation basis:** Read the installed Next.js 16 authentication, proxy, cookies, and redirect guides plus installed `@supabase/ssr` guidance. Current official Supabase SSR guidance was checked: the proxy uses `getClaims()` rather than trusting `getSession()`, while the DAL uses the fresh network-backed `getUser()` requested by this unit.
- **Failed checks retained:** The first production build rejected a non-function export from a `use server` module; initial state moved to the client component. One asynchronous form unit test queried before the action state settled and now awaits the accessible result. The first browser suite still expected unauthenticated dashboard access and the deleted fake cookie; tests now authenticate before protected checks and verify a real Supabase cookie. A later offline-state check started before the streamed dashboard finished; the shared login helper now waits for `#main-content`.
- **Automated/browser evidence:** Final lint, typecheck, 16 unit assertions, and production build passed. Ten serial Chromium checks passed, including signed-out redirect, generic invalid-credential messaging, sign-out followed by denied re-entry, 390/768/1440 layouts, and three role dashboards in separate browser contexts.
- **Security boundary:** No client code receives the demo password or service role. Browser authorization is never trusted: proxy, DAL, mutation helper, and database RLS form independent layers. Live authentication failures do not reveal whether the email or password was wrong.
- **Remaining:** Dashboard data is still the explicitly named temporary repository until P2-07.

## 2026-09-05 — P2-06 reproducible synthetic hosted identities

- **Work unit IDs:** P2-06
- **Outcome:** Added rerunnable SQL for fixed Demo SME, buyer, and funder organizations and a rerunnable admin provisioning script for the corresponding fictional profiles/auth users/memberships.
- **Changed areas:** `supabase/seed.sql`, `scripts/provision-demo-users.mjs`, environment template/schema, demo login action, package script.
- **Hosted evidence:** The seed applied to the linked project. The provisioning script passed twice, creating on first run and safely updating the same three identities on rerun. All names include Demo context at the organization or account workflow level, and addresses use the reserved `.example` domain.
- **Secret handling:** The generated password exists only in ignored `.env.local`; the provisioning service credential was injected transiently from the authenticated CLI. Neither appears in repository files, command output, browser output, or Git.
- **Remaining:** P2-07 must add representative synthetic application rows and replace hard-coded dashboard metrics/queues with typed RLS-filtered Supabase queries.

## 2026-09-05 — P2-07 live dashboards and Phase 2 gate

- **Work unit IDs:** P2-07; Phase 2 gate
- **Outcome:** Deleted the temporary demo session/repository and replaced it with a typed server-only Supabase dashboard repository. SME metrics and current application, buyer confirmation queue, and funder buyer-confirmed queue are calculated from hosted RLS-filtered rows. Empty collections render explicit empty states; query failures throw generic errors into the existing protected error boundary; route loading remains geometry-stable.
- **Seed expansion:** The safe provisioning script now idempotently upserts four Demo organizations, three hosted Demo identities/memberships, four synthetic applications, confirmation states, and explainable check results. No bank, government identity, real customer, or real email data is used.
- **Failed check retained:** After `supabase/seed.sql` changed, the hosted CLI updated its recorded seed hash but did not insert the new fourth organization; the following application upsert correctly failed its foreign key. Provisioning now upserts the same organization fixtures before dependent records, passed twice consecutively, and no longer relies on ambiguous remote seed-hash behavior.
- **Automated evidence:** Final lint, typecheck, 16 unit assertions, production build, and ten Chromium tests passed. Hosted database lint reports no errors. The randomized RLS suite passed select/insert/update/delete isolation; the storage suite passed private/public, expiry, path, MIME, and size checks; provisioning reran successfully.
- **Role/browser evidence:** Three clean browser contexts separately entered SME, buyer, and funder accounts. Each received its expected heading and a role-specific hosted row; each was explicitly checked not to render a row outside its permitted workflow/tenant. Signed-out redirect, generic bad-login error, real session cookie, sign-out, and denied post-sign-out re-entry also passed.
- **Secret evidence:** `.env.local` is ignored. Client static assets contain neither the local demo-password value nor server-only environment names. Repository working files contain no `sb_secret_` value or assigned demo password. Service credentials were transient only.
- **Phase 2 result:** All P2-01 through P2-07 acceptance checks are complete against the linked hosted Supabase project. No local Supabase service was used.
- **Remaining:** Phase 3 begins with the SME application draft form and secure three-document upload workflow.

## 2026-09-05 — P3-01 private SME application drafts

- **Work unit IDs:** P3-01
- **Outcome:** Added a protected `/applications/new` business step for selecting the Demo buyer, entering the purchase-order reference, invoice identity/value/currency and expected payment date, and explicitly consenting to AI document processing. The server repeats the SME role check, validates every field, verifies the buyer through RLS, creates only an SME-owned `draft`, and redirects to a private application summary.
- **Changed areas:** hosted application-detail migration and generated database types; application validation, server action, form, new/detail routes; protected navigation and SME call to action; Demo cleanup/provisioning; unit, integration, and browser tests.
- **Failed checks retained:** The first browser assertion matched both the route alert and the form error-summary alert; it now scopes to the form summary. The initial insert used `INSERT ... RETURNING`, which the current RLS visibility policy rejected even though the insert itself was permitted. The action now assigns a server-generated UUID, inserts without a returning clause, and redirects with that UUID; a hosted authenticated round-trip independently proves the row is readable by its SME owner.
- **Automated evidence:** Final lint and typecheck passed; seven Vitest files with 23 assertions passed; the Next.js production build passed. Twelve serial Chromium checks passed, including linked invalid-field errors, a successful hosted SME draft creation, and generic buyer denial. A hosted authenticated integration test created, read, asserted, and removed an exact-value consented draft. Linked hosted database lint reports no schema errors, and Demo provisioning/cleanup passed after the browser suite.
- **Manual visual evidence:** Inspected the live route at desktop width and at 390 × 844. The desktop form has a clear hierarchy and compact two-column detail grid; mobile collapses to one column with no horizontal overflow and keeps the four-item bottom navigation visible. The purchase-order input exposes a visible three-pixel focus ring, and the consent explanation remains adjacent to its control.
- **Security/demo boundary:** Only hosted Supabase is used. Buyer choices are RLS-visible Demo organizations; client input cannot choose the owning SME or creator; consent time is written server-side; wrong roles and tenant IDs receive a generic not-found response. All money movement and finance decisions remain explicitly simulated.
- **Remaining:** P3-02 is next: a five-step Details → Documents → Review → Verification → Buyer task layout whose progress comes from hosted server data.

## 2026-09-05 — P3-02 server-derived guided application journey

- **Work unit IDs:** P3-02
- **Outcome:** Added the five-step Details → Documents → Review → Verification → Buyer journey to both draft creation and the private application route. Desktop uses a sticky progress card beside the task panel; mobile uses `Step n of 5`, an accessible progress bar, the current task, and the next locked prerequisite. Completed/current/locked states come from the hosted application status plus RLS-visible document categories on every request.
- **Changed areas:** pure application-progress model, responsive task-layout component, new/detail application routes, shared heading containment, unit tests, and hosted browser flow.
- **Failed checks retained:** The first typecheck revealed that conceptual status names from an early planning note did not match the generated hosted enum. The progress model was corrected to use the actual `documents_uploaded`, `fields_extracted`, `sme_reviewed`, and `checks_complete` sequence. Visual QA then found global landing-page `h1` CSS leaking into protected mobile pages; the landing typography is now scoped to `.hero h1`, and application identifiers use safe wrapping.
- **Automated evidence:** Final lint and typecheck passed; nine Vitest files with 30 assertions passed, covering pre-draft, saved-details, three-document, reviewed, checked, and buyer-confirmed states plus locked explanations. The production build passed. Twelve serial Chromium checks passed; the hosted SME flow creates a draft, confirms Documents is current and later steps are locked, then proves the same `1 of 5 complete` result after both refresh and browser back. Demo cleanup passed afterward.
- **Manual visual evidence:** Inspected the hosted-data route at 1280px and 390 × 844. Desktop shows the five-step sticky rail and a 720px task panel; mobile shows a compact progress card and bottom navigation. Both report zero horizontal overflow. Long invoice references wrap cleanly at 48px desktop and 36px mobile heading sizes.
- **Security/state boundary:** No browser-local progress flag exists. Details are complete only from stored application fields and server-written consent; document progress uses RLS-visible document categories or a later persisted application status. Locked controls remain genuinely disabled and explain the prerequisite.
- **Remaining:** P3-03 is next: the three named private upload slots with type/size validation, progress, cancel/retry/remove, and signed preview.

## 2026-09-05 — P3-03 private resumable document slots

- **Work unit IDs:** P3-03
- **Outcome:** Replaced the document placeholder with one named slot each for purchase order, delivery evidence, and invoice. Every slot explains its purpose, supports drag/drop and browse, validates PDF/JPEG/PNG plus a 10 MiB ceiling, sanitizes the storage filename, reports real resumable progress, and provides cancel, retry, remove, page count, and private preview controls.
- **Hosted architecture:** A server action first registers an RLS-owned document/path. The browser then sends bytes directly to Supabase Storage's TUS endpoint in fixed 6 MiB chunks using the current access token only as a credential. Finalization downloads the private object server-side, checks byte count and magic signature, reads PDF page count, writes a completion timestamp, and advances the application only after all three categories are complete. Preview uses a 60-second signed URL; no public object URL is generated by the app. This follows the official Supabase resumable-upload and private-bucket guidance.
- **Changed areas:** upload-completion migration and regenerated hosted types; document validation, upload reducer, server actions, three-slot client panel, application data query/progress derivation, dependencies, cleanup script, storage integration tests, and full hosted browser flow.
- **Failed checks retained:** TypeScript initially could not narrow combined success/shape checks from server-action unions; success discrimination and payload validation are now separate. The first three-file browser run exceeded the test's original 30-second total while the third slot was preparing, so only that full hosted workflow receives a 120-second budget. A PDF-preview navigation assertion proved brittle because Chromium's viewer aborts the navigation after the signed request begins; the browser now asserts the completed Preview control while the hosted storage test directly proves signed loading and public denial. That storage test's one-second expiry window also proved too narrow under network variance and now uses three seconds followed by a 4.5-second expiry check.
- **Automated evidence:** Final lint and typecheck passed; ten Vitest files with 34 assertions passed. The production build passed. Twelve serial Chromium checks passed, including wrong type, oversize, three real hosted TUS uploads, page counts, Review unlocking, removal, refresh, and browser-back persistence. The authenticated storage suite rejects a duplicate slot, malformed path, wrong MIME, and 10 MiB + 1 byte; it also proves public failure, signed preview success, expiry failure, and cleanup. Hosted draft round-trip and linked database lint also pass.
- **Manual visual evidence:** Inspected the live RLS-backed state at 1280px and 390 × 844. Desktop keeps the sticky journey beside three calm, clearly separated evidence cards. Mobile stacks the drop zone and uploaded receipts with readable Preview/Remove controls and the persistent bottom navigation. Both widths report zero horizontal overflow.
- **Security/recovery boundary:** Storage remains private; RLS binds organization/application/document IDs to the object path. The server repeats SME ownership and editable-status checks for prepare, finalize, and remove. MIME labels alone are not trusted. Interrupted rows can be replaced safely, TUS resumes a known fingerprint, terminal validation failures clear the object/row, and E2E cleanup removes storage objects before application rows. Server-computed hashes are groundwork only; P3-04 remains unchecked until exact-duplicate rule `V009` and cross-tenant disclosure tests are complete.
- **Remaining:** P3-04 is next: formalize trusted SHA-256 duplicate handling as `V009`, including same bytes under another filename and non-disclosure across tenants.

## 2026-09-05 — P3-04 trusted exact-duplicate rule V009

- **Work unit IDs:** P3-04
- **Outcome:** Formalized exact-file rejection as deterministic rule `V009`. Finalization downloads the private object in the authenticated server workflow, computes SHA-256 from those bytes, checks only RLS-visible completed documents in the same SME organization, and persists the hash only after signature/page validation. A renamed file with identical bytes is removed before extraction and returns a plain `V009 · Exact duplicate file` message.
- **Database boundary:** Added a least-privilege `security definer` function that can write the otherwise immutable verification run/check only when the caller is an authenticated SME on an editable owned application and the hash already exists in that same organization. It records only the attempted filename and generic `same_organization` scope—never another application's or document's identity. Calls with a hash that exists only in another tenant fail as if no duplicate exists.
- **Changed areas:** hosted V009 migration and regenerated types, trusted duplicate comparison/finalization action, renamed-file browser scenario, and randomized two-tenant hosted integration suite.
- **Automated evidence:** Final lint and typecheck passed; ten Vitest files with 34 assertions passed; the production build passed. Twelve serial Chromium checks passed, including real upload of one file followed by the same bytes under a different filename, visible V009 rejection, and successful recovery with a different file. The hosted two-tenant suite proves a persisted `V009 fail`, no document admitted to the attempted application's extraction set, the same hash accepted for Tenant B, zero Tenant-B hash rows visible to Tenant A, and a cross-tenant RPC probe rejected. Linked hosted database lint reports no errors and all probes/E2E objects were cleaned.
- **Race/failure behavior:** The normal pre-update lookup records V009 before removing the attempted object. The unique-index race fallback also records V009 before reporting that code; if immutable check recording fails, it returns only a generic finalization error rather than claiming a V009 record exists.
- **Security boundary:** No client-supplied digest is trusted. Hash matching is exact and organization-scoped, the object remains private, and no conflicting filename, path, document ID, application ID, organization ID, or digest is disclosed to the uploader.
- **Remaining:** P3-05 is next: reopen drafts at the first incomplete server-derived step and prove sign-out/sign-in recovery without showing deleted or failed uploads as complete.
