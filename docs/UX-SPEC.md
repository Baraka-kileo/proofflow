# Page-by-page UX specification

## Shared app shell

Desktop uses a quiet cream canvas, persistent role-aware rail, compact organization switcher, and top bar with page context and profile. Mobile uses a sticky title bar and bottom navigation. Each screen has one primary action. Global feedback uses a toast for background completion and an inline alert for errors requiring action.

### Role navigation

- SME: Overview, Applications, Trust Passport, Help, Account. Applications opens `/applications`; creation is a separate action.
- Large customer: Overview, Confirmations, History, Help, Account. Confirmations and History open separate pages.
- Funder / Bank: Overview, Applications, Offers, Help, Account. Applications and Offers open separate pages.

`Large customer` is the user-facing name for the existing internal `buyer` role. Internal role keys, database columns, policies, and audit event names stay unchanged. The signed-in organization and role appear together in the account header and in one compact Demo workspace card at the bottom of the desktop rail.

## `/login`

Split desktop composition: concise ProofFlow value statement/evidence motif on the left and a focused sign-in card on the right. Mobile shows the card first. The ordinary email, password, and Sign in controls appear before the clearly labelled demo-account quick-fill buttons. Demo choices use distinct SME, Large customer, and Funder / Bank colors, fill the fields above, and never submit automatically. Do not allow public large-customer/funder role creation.

## `/dashboard`

The greeting is secondary; the next task is dominant.

- SME: hero status card with `Continue application`/`Start application`, three small metrics, recent applications, and Trust Passport progress.
- Large customer: short status and metrics, then clear links to the separate confirmation queue and decision history.
- Funder / Bank: short status and metrics, then clear links to the separate application queue and offer history.

Cards enter with a short stagger. Skeletons reproduce their final geometry to prevent layout shift.

## `/applications`, `/confirmations`, `/confirmations/history`, and `/offers`

List work is separated from Overview. SME and funder Applications show only their relevant rows. Buyer Confirmations shows only pending requests, while History contains read-only completed decisions. Funder Offers contains only recorded simulated decisions. Each page has one clear heading, a count, a concise empty state, and direct record actions; sidebar navigation never uses an in-page hash as a substitute for a page.

## `/applications/new`

A five-step task list: Business details → Documents → Review extracted fields → Verification → Send to buyer. Desktop keeps the task list in a sticky left column and the active form in a 720px panel. Mobile uses a compact `Step 2 of 5` header and progress bar.

Document upload has three named slots, not a generic drop zone. Each slot explains acceptable evidence, supports drag/drop and browse, shows filename/size/page count, numeric upload progress, extraction progress, preview/remove/retry, and a completed check animation. Continue is disabled with a plain explanation until requirements are met.

## `/applications/[id]`

Header: application ID, buyer, amount, status chip, and the single next action. Body uses an evidence timeline followed by a verification report. Each check shows name, pass/review/fail, the compared values, and a plain explanation. Source document previews open in a side sheet. Activity appears after evidence—not as the main content.

## Extraction review

Desktop uses document preview left and editable normalized fields right. Mobile switches between `Document` and `Fields` while preserving progress. Low-confidence fields receive a `Please check` badge, never an unexplained percentage. Changed values are marked `Edited by you`; Save & continue remains sticky on mobile.

## `/confirmations/[id]`

Buyer sees a focused three-stage confirmation rather than an approval button. Stage 1 presents one of six numbered `Yes`/`No` questions at a time with `Question n of 6`, a progress bar, Back/Next controls, and the relevant supplier, PO, invoice, amount, outstanding amount, due date, or delivery evidence beside it. Selecting `No` reveals a persistent explanation field. Progress and answers survive moving forward/back.

Stage 2 presents `You are confirming that` with a generated plain-language summary and the actions `Confirm & Continue` and `Go Back & Correct`. Any `No` instead presents the disputed facts and a single `Submit dispute` action; it never displays confirmation language.

Stage 3 presents the versioned Buyer Declaration. Full name, company, and verified corporate email are read-only server-derived values; the buyer enters only job title and draws in a labelled signature canvas usable by mouse, pen, touch, keyboard clear, and mobile orientation changes. Date/time and approval ID are server-generated. The only primary action is `Sign & Submit Confirmation`.

A completed confirmation becomes a read-only receipt and certificate view. It shows every answer, actor identity, rendered signature, timestamp, approval ID, internal verification reference, download action, and the disclaimer that confirmation is not a guarantee of payment. A completed dispute shows every negative answer and explanation without signature/certificate controls.

## `/confirmations/[id]/certificate`

Authorized buyer, owning SME, and eligible funder receive the same immutable one-page PDF certificate generated from stored confirmation facts. It uses a clear ProofFlow heading, transaction table, six confirmation marks, authorized representative block with the captured signature, verification reference, and payment-guarantee disclaimer. Loading, denied, and unavailable-certificate states fail closed.

## `/offers/[id]`

Funder view shows evidence on the left and a sticky offer form on desktop. SME view becomes a comparison card showing invoice value, advance, fee, net amount, due date, and simulated repayment flow. Accept and decline are visually distinct; acceptance requires a confirmation dialog reiterating that this is a hackathon simulation.

## `/trust-passport`

An evidence-based profile—not a mysterious score. Show verified buyer confirmations, completed applications, dispute count, total verified value, and a dated evidence timeline. Explain exactly what improves the profile and state that it is not a credit score.

## `/account`, Help, and system pages

Account shows identity, organization, role, and sign-out. Help contains a short three-role explainer and privacy boundary. `loading.tsx`, `error.tsx`, `not-found.tsx`, empty states, and offline/retry messaging use the same visual language and always provide a recovery action.

## Accessibility acceptance

Keyboard order follows the visual flow; focus is always visible; dialogs trap and restore focus; headings are hierarchical; form inputs have persistent labels; progress and status changes announce through `aria-live`; text contrast meets WCAG 2.2 AA; touch targets are at least 44px; all meaningful icons have accessible names or adjacent text.

## Demo Coupa states

- SME: `Automated verification` explains that reviewed invoice fields are being compared with synthetic Demo Coupa data. Success says `Automated verification complete`; a difference says `Buyer review needed`; paid says `Application cannot proceed`; unavailable says the signed confirmation fallback was requested.
- Buyer Account: **Business connections** shows Coupa, `Demo connection active`, and that live Coupa is unavailable without an authorized sandbox.
- Buyer Confirmations: system differences and signed confirmations share one short task queue but are clearly labelled. The exception detail reveals only differing fields and uses three direct actions.
- Funder: eligible packages say either `Buyer Confirmed` or `Automated verification complete`, show source/time/checks/reference, and link to the correct certificate.
- Application detail uses progressive disclosure: the result, action, source, time, and exceptions appear first; successful V001-V012 and C001-C010 details stay available inside keyboard-accessible native disclosure controls.
- Demo sign-in role buttons only fill the visible email and password fields. They never authenticate immediately; the user reviews the selected credentials and presses **Sign in**.
- System certificates never show a human representative or signature. Both certificate types carry a verification reference and the payment/funding non-guarantee.
- All new routes require loading, empty/not-found/error, keyboard focus, 44px controls, responsive layouts, and concise copy.
