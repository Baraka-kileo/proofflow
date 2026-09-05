# Contributing to ProofFlow

ProofFlow handles a fintech evidence workflow, so changes must preserve its privacy, authorisation and decision boundaries.

## Before changing code

Read `docs/PRODUCT-SCOPE.md`, `docs/USER-FLOWS.md`, `docs/UX-SPEC.md`, `docs/DESIGN-SYSTEM.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md` and `docs/BUILD-CHECKLIST.md`.

## Development contract

- Keep one application with role-based SME, large-customer and funder views.
- Do not add AI processing of uploaded documents.
- Enforce access on the server and through database Row Level Security.
- Do not fabricate integrations, compliance results, approvals or money movement.
- Keep test data fictional and free of personal or customer information.
- Remove or clearly disable controls whose actions are not implemented.
- Add tests for new domain rules, permissions and important user states.

## Pull-request checks

```bash
npm ci
npm run lint
npm run typecheck
npm run test:unit
npm run build
npm run test:e2e
```

Database integration checks require a configured Supabase environment. Record completed checklist evidence in `docs/IMPLEMENTATION-LOG.md` without adding secrets, credentials or real financial documents.
