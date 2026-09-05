# ProofFlow security and privacy model

## Scope and trust boundary

ProofFlow is a hackathon MVP for coordinating invoice-finance evidence. It protects the application workflow and supporting documents; it is not a bank, identity provider, credit bureau or payment processor.

- SMEs provide transaction evidence and a declaration.
- ProofFlow performs fixed consistency checks and preserves lineage.
- Large customers confirm or dispute transaction facts.
- Funding partners or their approved providers perform KYC/KYB, AML and underwriting outside ProofFlow.
- ProofFlow does not use AI to process uploaded documents.
- ProofFlow does not claim funding approval or money movement without an authorised partner result.

## Data classification and minimisation

| Class | Examples | Handling |
|---|---|---|
| Public | Marketing copy, pricing model, security explanation | Public routes |
| Account | Name, email, organization and role | Authenticated access; restricted by membership |
| Confidential transaction evidence | Purchase order, delivery evidence, invoice and entered values | Private storage and tenant-scoped database records |
| Restricted workflow metadata | Compliance status, provider, external reference and funding decision | Role-restricted; audited |
| Prohibited in ProofFlow | Biometrics, selfies, sanctions reports, raw KYC/KYB documents and confidential underwriting reasoning | Remains with the regulated funder or approved provider |

Only the status and reference needed to coordinate external compliance are stored. This reduces the impact of a ProofFlow data exposure and avoids duplicating high-risk identity evidence.

## Threat and control matrix

| Threat | Implemented control | Remaining production work |
|---|---|---|
| Cross-tenant record access | Server-side organization/role checks and PostgreSQL Row Level Security | Independent policy and penetration testing |
| Insecure direct document access | Private storage paths and short-lived signed URLs | Signed-link lifetime review, download monitoring and revocation exercises |
| Malicious or unintended upload | MIME, file-size and PDF page-count validation | Malware scanning and content-disarm pipeline |
| Duplicate evidence | SHA-256 fingerprinting and duplicate checks | Cross-organization fraud controls require a lawful data-sharing design |
| Partial or tampered evidence submission | Exact 21-field validation and atomic database function | Formal abuse-case testing and tamper-evident log export |
| Forged third-party result | Server-only adapter boundary; unavailable integrations fail closed; authenticated confirmation fallback | Signed webhooks, replay protection, partner allow-listing and key rotation |
| Excessive identity-data collection | Raw KYC/KYB evidence is explicitly excluded | Data-protection impact assessment with each partner |
| Secret leakage | Server-only secrets are not exposed with `NEXT_PUBLIC_`; environment files are ignored | Managed secret rotation, scanning and least-privilege service credentials |
| Account enumeration | Generic sign-in failure text | Rate limiting, bot protection and anomaly detection |
| Premature claim of disbursement | Product stops at proposal acceptance until an authorised external confirmation | Contracted callback schema and settlement reconciliation |
| Loss of auditability | Actor, timestamp, status, declaration and rule-version records | Independent retention policy and immutable archive strategy |
| Availability or data loss | Hosted database and application deployment | Tested backups, recovery objectives, monitoring, alerting and incident exercises |

## Implemented controls

### Identity and authorisation

- Supabase Authentication establishes the signed-in identity.
- Protected operations verify membership and permitted role on the server.
- Row Level Security limits direct database access by tenant and responsibility.
- Client-side navigation and hidden controls are convenience only; they are not treated as authorisation.

### Documents and evidence

- Evidence is stored in a private bucket and accessed through short-lived signed URLs.
- Upload validation checks supported MIME type, maximum size and PDF page count.
- SHA-256 fingerprints support exact-duplicate detection.
- Manual evidence entry validates the entire expected field set before a single atomic write.
- Entered values retain their source document, actor and timestamp.

### Verification and external systems

- V001–V012 checks are deterministic and versioned.
- Outcomes record compared inputs and plain-language reasons.
- An unauthorised or unavailable connector never produces a successful external response.
- Customer confirmation requires an authenticated user and versioned declaration.
- Compliance records contain workflow status and reference, not raw identity evidence.
- Funding proposals remain the funder's independent decision.

## Privacy principles

ProofFlow follows data minimisation, purpose limitation, least privilege and explainability as product rules. People must be able to see which evidence supports a decision and which institution remains accountable. The MVP makes no claim of POPIA compliance certification; a production deployment requires a documented lawful basis, operator agreements, retention/deletion schedules, data-subject processes and cross-border transfer assessment.

## Production readiness gate

Do not onboard real organizations until these controls have independent evidence:

1. penetration test and remediation;
2. privacy/legal review, data-protection impact assessment and partner contracts;
3. malware scanning, rate limits, monitoring and alerting;
4. backup/restore test and defined recovery objectives;
5. incident response, breach notification and key-rotation rehearsal;
6. documented retention, deletion and data-subject request procedures;
7. accessibility audit and operational support ownership;
8. authorised integration credentials, signed webhook verification and reconciliation.

## Vulnerability reporting

Report suspected vulnerabilities privately through [GitHub Security Advisories](https://github.com/Baraka-kileo/proofflow/security/advisories/new). Do not place personal, customer or financial information in a public issue.
