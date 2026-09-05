# Security and data privacy

## Hackathon data rule

Use synthetic people, companies, documents, bank details, and amounts only. The selected Gemini free tier may process data under terms unsuitable for real confidential financial documents; production use requires an approved commercial agreement and privacy review.

The public login page may expose credentials only for the dedicated fictional hackathon accounts. Selecting a role fills standard labelled email and password fields but does not submit them. These credentials must never be reused for production users, and the demo-account selector must be removed or disabled before production launch.

## Controls required in the MVP

- Private storage buckets; time-limited signed URLs; no public document URLs
- Row Level Security for every business table and storage path
- Role assignment controlled by invitations/seed data, never by a public form parameter
- Server-side role and ownership checks on every mutation
- PDF/JPEG/PNG allowlist, maximum size, file-count limits, and sanitized filenames
- SHA-256 hashes and organization-aware duplicate checks
- Zod validation of forms, route payloads, and AI output
- No secrets in browser bundles, logs, commits, screenshots, or error messages
- Safe audit events: actor, action, resource, timestamp, and non-sensitive metadata
- Generic authentication errors and rate limiting for sensitive endpoints
- Clear consent before sending a document to an AI processor
- Treat the handwritten acknowledgement as sensitive personal data: validate bounded stroke JSON, never accept executable markup, render it through a canvas/PDF drawing API, and expose it only through existing role/tenant authorization.
- Derive buyer name, organization, verified corporate email, signature time, and approval ID on the server. Never trust hidden form values for identity or time.

## Threats considered

- **IDOR/cross-tenant access:** prevent with ownership joins and RLS, then test with two organizations.
- **Privilege escalation:** prevent role self-selection and service-key exposure.
- **Malicious upload:** validate MIME, extension, size, count, and storage name; production adds malware scanning.
- **Prompt injection inside documents:** extraction uses a fixed schema and treats document text only as data; model output cannot invoke tools or alter policy.
- **AI hallucination:** confidence indicators, source preview, mandatory human review, and deterministic checks.
- **Duplicate/fabricated invoices:** file hash, normalized invoice reference, cross-document rules, and buyer attestation.
- **Replay/double decision:** unique constraints and idempotent mutations.
- **Signature/certificate substitution:** bind the signed declaration, six answers, transaction snapshot, actor, organization, and approval ID in one database transaction; certificate routes regenerate only from that immutable record.
- **Sensitive leakage:** signed links, short expiry, log redaction, least privilege, and retention controls.

## Production gaps to disclose

Independent penetration testing, malware scanning, POPIA legal assessment, signature-enforceability review, qualified digital-signature trust services, retention/deletion automation, incident response, KYC/AML, regulated credit process, lender due diligence, bank/payment integration, and production monitoring are not represented as complete.

## Buyer-system integrations

- Demo Coupa contains synthetic records only and is labelled on every result and certificate.
- Connector calls run server-side. Browser clients cannot read `credential_reference`; live tokens must be held by a secret vault and use read-only OAuth scopes.
- Every connector response is untrusted until strict Zod validation succeeds. Coupa responses are never sent to Gemini.
- Canonical snapshots contain only transaction evidence needed for C001-C010, are SHA-256 hashed, immutable to ordinary clients, and subject to application RLS.
- Buyer organizations see only their connection and mappings. SMEs see only their own transaction result. Funders see system evidence only after eligibility.
- A missing record is a review result, not fraud. A paid invoice blocks progression. Connection failure falls back to signed confirmation.
- Live activation additionally requires buyer-admin authorization, credential rotation/revocation, retention/deletion policy, audit monitoring, and POPIA/contract review.
