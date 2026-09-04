# ProofFlow

ProofFlow helps South African SMEs turn completed work into a funder-ready, buyer-confirmed invoice package. It reduces the time spent proving that an invoice is genuine; it does not pretend to remove a buyer's payment terms or automatically grant credit.

Built for the ABSA Studentpreneur Hackathon 2026 challenge: **Access to Finance — From Invoice to Cash**.

## Demo journey

1. An SME uploads a purchase order, delivery note, and invoice.
2. Gemini extracts structured fields; the SME reviews and corrects them.
3. Deterministic rules compare parties, references, totals, dates, and duplicates.
4. The buyer confirms or disputes the delivery in their in-app portal.
5. A funder reviews the evidence and creates a simulated early-payment offer.
6. The SME accepts the simulated offer and their Trust Passport updates.

## Stack

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, shadcn/ui
- Supabase Auth, Postgres, private Storage, Realtime, and Row Level Security
- Gemini Flash for document extraction; Zod for runtime validation
- Vitest and Playwright; GitHub Actions; Vercel deployment

## Start locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Use synthetic documents only. See `docs/BUILD-CHECKLIST.md` for current progress and `docs/DEMO-SCRIPT.md` for the judged flow.

## Important boundary

ProofFlow is a funding-readiness and workflow demonstration. Credit decisions and disbursement are simulated. A production release would require lender integrations, regulatory/legal review, fraud operations, data-processing agreements, and production security testing.
