# Page-by-page UX specification

## Shared app shell

Desktop uses a quiet cream canvas, persistent role-aware rail, compact organization switcher, and top bar with page context and profile. Mobile uses a sticky title bar and bottom navigation. Each screen has one primary action. Global feedback uses a toast for background completion and an inline alert for errors requiring action.

### Role navigation

- SME: Overview, Applications, Trust Passport, Help, Account
- Buyer: Overview, Confirmations, History, Help, Account
- Funder: Overview, Applications, Offers, Help, Account

## `/login`

Split desktop composition: concise ProofFlow value statement/evidence motif on the left and a focused sign-in card on the right. Mobile shows the card first. Demo-role accounts are visible as clearly labelled quick-fill buttons. Do not allow public buyer/funder role creation.

## `/dashboard`

The greeting is secondary; the next task is dominant.

- SME: hero status card with `Continue application`/`Start application`, three small metrics, recent applications, and Trust Passport progress.
- Buyer: urgent pending-confirmation queue, SLA age, supplier/amount summary, then history.
- Funder: buyer-confirmed review queue, total requested, risk/check summary, then recent offers.

Cards enter with a short stagger. Skeletons reproduce their final geometry to prevent layout shift.

## `/applications/new`

A five-step task list: Business details → Documents → Review extracted fields → Verification → Send to buyer. Desktop keeps the task list in a sticky left column and the active form in a 720px panel. Mobile uses a compact `Step 2 of 5` header and progress bar.

Document upload has three named slots, not a generic drop zone. Each slot explains acceptable evidence, supports drag/drop and browse, shows filename/size/page count, numeric upload progress, extraction progress, preview/remove/retry, and a completed check animation. Continue is disabled with a plain explanation until requirements are met.

## `/applications/[id]`

Header: application ID, buyer, amount, status chip, and the single next action. Body uses an evidence timeline followed by a verification report. Each check shows name, pass/review/fail, the compared values, and a plain explanation. Source document previews open in a side sheet. Activity appears after evidence—not as the main content.

## Extraction review

Desktop uses document preview left and editable normalized fields right. Mobile switches between `Document` and `Fields` while preserving progress. Low-confidence fields receive a `Please check` badge, never an unexplained percentage. Changed values are marked `Edited by you`; Save & continue remains sticky on mobile.

## `/confirmations/[id]`

Buyer sees a clean attestation page: SME identity, PO/invoice reference, total/due date, delivery evidence preview, and any warnings. Three explicit checkboxes precede `Confirm delivery`. `Dispute` opens a dialog requiring a reason. A completed action becomes a read-only receipt with actor and timestamp.

## `/offers/[id]`

Funder view shows evidence on the left and a sticky offer form on desktop. SME view becomes a comparison card showing invoice value, advance, fee, net amount, due date, and simulated repayment flow. Accept and decline are visually distinct; acceptance requires a confirmation dialog reiterating that this is a hackathon simulation.

## `/trust-passport`

An evidence-based profile—not a mysterious score. Show verified buyer confirmations, completed applications, dispute count, total verified value, and a dated evidence timeline. Explain exactly what improves the profile and state that it is not a credit score.

## `/account`, Help, and system pages

Account shows identity, organization, role, and sign-out. Help contains a short three-role explainer and privacy boundary. `loading.tsx`, `error.tsx`, `not-found.tsx`, empty states, and offline/retry messaging use the same visual language and always provide a recovery action.

## Accessibility acceptance

Keyboard order follows the visual flow; focus is always visible; dialogs trap and restore focus; headings are hierarchical; form inputs have persistent labels; progress and status changes announce through `aria-live`; text contrast meets WCAG 2.2 AA; touch targets are at least 44px; all meaningful icons have accessible names or adjacent text.
