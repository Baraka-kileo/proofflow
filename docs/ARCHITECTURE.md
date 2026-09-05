# Architecture

ProofFlow is one Next.js and Supabase application with three role-based views.

## Evidence path

1. The SME creates an application and uploads three private files.
2. The database prepares the fixed evidence-field contract.
3. The SME reads each file and enters every required value.
4. One database transaction validates and saves all 21 fields, the actor, timestamps and declaration.
5. The deterministic V001–V012 engine compares documents and duplicate history.
6. A real authorised customer integration is preferred when configured; otherwise authenticated confirmation is requested.
7. A confirmed package becomes visible to eligible funders.
8. The funder performs external compliance and underwriting, then records status and an independent decision.
9. Disbursement is confirmed only through a future authorised funding-partner callback.

Legacy column and status names may remain temporarily in the database for safe migration compatibility, but current product code does not provide AI extraction or an interactive simulated integration.

## Trust boundaries

Browser → server action → ownership/role check → RLS-protected database or private storage.

Uploaded bytes never leave the protected document path for AI processing. External systems are called only through authorised, server-side connectors with explicit credentials and audit records.
