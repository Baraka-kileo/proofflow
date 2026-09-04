<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# ProofFlow delivery contract

This repository is a 12-hour hackathon MVP. Before coding, read `docs/PRODUCT-SCOPE.md`, `docs/USER-FLOWS.md`, `docs/UX-SPEC.md`, `docs/DESIGN-SYSTEM.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/BUILD-CHECKLIST.md`, and `docs/IMPLEMENTATION-LOG.md`.

## Non-negotiable rules

- Follow the start/end protocol in `docs/BUILD-CHECKLIST.md`. Select the first incomplete MUST unit whose dependencies are complete. Mark it complete only after every acceptance check passes and its evidence is appended to `docs/IMPLEMENTATION-LOG.md`.
- Never use “partially complete” as a reason to check a box. Leave it unchecked and log exactly what remains.
- Keep `main` runnable and demoable. Do not commit secrets or real financial/customer documents.
- Enabled controls must work. If a feature is not implemented, remove it or label it clearly as unavailable.
- Build one application with role-based views for SME, buyer, and funder; do not create separate products.
- Use Gemini only to extract structured fields. Use deterministic TypeScript rules for financial comparisons and decisions.
- AI output is untrusted input: validate it with Zod and require human review before verification.
- Enforce authorization on the server and with Supabase Row Level Security. Client-side hiding is never authorization.
- Every page needs responsive, keyboard-accessible loading, empty, error, success, and disabled states where relevant.
- Motion must explain progress or state change, stay between 150–250 ms, and respect `prefers-reduced-motion`.
- Use synthetic hackathon data only. Money movement and credit approval are simulated and must be labelled as such.

## Completion gate

Before checking off a phase, run its named gate and record the results. Before claiming the MVP is complete, satisfy the exact final-completion rule at the end of `docs/BUILD-CHECKLIST.md`.
