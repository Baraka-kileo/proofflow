# Architecture

## System shape

```text
Browser (role-based Next.js UI)
  -> Next.js Server Components / Route Handlers
     -> Supabase Auth
     -> Postgres + Row Level Security
     -> Private Storage + signed previews
     -> Gemini document extraction
     -> Deterministic verification engine
```

## Responsibility boundaries

- **Gemini:** extract candidate values and confidence from PDF/image content. It never decides eligibility, creates an offer, or silently overwrites reviewed data.
- **Zod:** rejects malformed model/API output and normalizes dates, currency, identifiers, and whitespace.
- **Verification engine:** pure TypeScript rules compare buyer/supplier names, PO numbers, invoice references, totals, currency, delivery timing, invoice timing, and file hashes. Every rule returns `pass`, `review`, or `fail` plus evidence and a human explanation.
- **Supabase:** source of truth for identities, organizations, roles, applications, documents, extracted/reviewed fields, checks, confirmations, offers, and audit events.
- **Next.js:** orchestration and least-privilege user interface. `proxy.ts` may redirect optimistically but authorization is repeated in server code and RLS.

## Core tables

`profiles`, `organizations`, `memberships`, `applications`, `documents`, `document_fields`, `verification_runs`, `verification_checks`, `confirmations`, `offers`, and `audit_events`.

All business rows carry organization/application ownership. State transitions are validated server-side. Sensitive writes use authenticated user context; service-role access is restricted to server-only workflows.

## Repository layout

- `src/app`: routes, layouts, server endpoints, error/loading boundaries
- `src/components`: shared accessible interface primitives
- `src/features`: domain UI grouped by workflow
- `src/lib`: AI, auth, database, hashing, validation, rules, audit utilities
- `supabase`: reproducible schema, policies, and synthetic seed data
- `tests`: rule-level and end-to-end critical-path tests
- `docs`: the product and delivery contract

## Reliability decisions

- Hash before extraction to block duplicate invoices early.
- Store original AI response for debugging but show normalized validated fields.
- Make confirmation and offer mutations idempotent.
- Audit every material state transition.
- Provide deterministic demo mode/seed data if an external AI service is unavailable, clearly labelled in the UI.
