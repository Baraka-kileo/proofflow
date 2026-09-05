# User flows and status model

## Core flow

```text
SME draft
  -> documents uploaded
  -> fields extracted
  -> SME reviewed
  -> automated checks complete
  -> buyer confirmation pending
  -> buyer confirmed
  -> funder review
  -> offer made
  -> SME accepted
  -> simulated funded
```

Alternative paths: extraction can fail and be retried/manual; automated checks can request review; the buyer can dispute with a reason; the funder can decline with a reason; the SME can decline or let an offer expire.

## SME journey

1. Sign in and land on an overview showing the next action.
2. Start an application and enter buyer/business context.
3. Upload exactly three evidence categories: purchase order/contract, delivery note/completion certificate, invoice.
4. Watch per-file upload and extraction progress.
5. Review extracted fields side-by-side with document previews; edit uncertain values.
6. Submit for checks and read plain-language results.
7. Send the verified package to the selected seeded buyer organization.
8. Track buyer status and the application timeline.
9. Review the funder's simulated terms, including amount, fee, net advance, and repayment source.
10. Accept or decline, then view updated Trust Passport evidence.

## Buyer journey

1. Sign in to a dashboard showing pending confirmations first.
2. Open a request and see the supplier, invoice summary, delivery evidence, and warning checks.
3. Answer `Yes` or `No` to six evidence-linked questions: PO issued, delivery accepted, invoice recognized, amount correct, invoice outstanding, and expected payment date correct.
4. Provide a short explanation beside every `No`. Any `No` produces an immutable disputed outcome and cannot produce a positive confirmation certificate.
5. When all answers are `Yes`, review the generated `You are confirming that` summary and either go back or continue.
6. Accept the versioned buyer declaration, confirm the server-derived name/company/verified corporate email, enter a job title, and draw a signature with mouse, pen, or touch.
7. Submit once. The server records the exact answers, declaration version, identity, validated signature strokes, timestamp, and unique approval ID transactionally.
8. View and download the immutable ProofFlow Buyer Confirmation Certificate or use its verification reference inside ProofFlow.

## Funder journey

1. Sign in to a queue showing buyer-confirmed packages first.
2. Open a package and see source documents, extracted facts, rule results, buyer answers, identity, signature, downloadable certificate, duplicates, and audit timeline.
3. Create a transparent simulated offer or decline with a reason.
4. Track offer status without gaining write access to SME evidence.

## State ownership

- SME owns drafts and field review.
- The system owns extraction/check results and audit timestamps.
- Buyer owns the immutable answers, reasoned dispute or signed confirmation, and declaration. Profile, organization, verified email, timestamp, and approval ID are server-derived.
- Funder owns offer/decline.
- No role may edit another role's completed decision.
