import { createClient } from "@supabase/supabase-js";

const url = process.env.PROOFFLOW_TEST_SUPABASE_URL;
const anonKey = process.env.PROOFFLOW_TEST_PUBLISHABLE_KEY;
const password = process.env.PROOFFLOW_DEMO_PASSWORD;

if (!url || !anonKey || !password) {
  throw new Error("Hosted funder-offer test configuration is missing.");
}

const funder = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const sme = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const buyer = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const offeredApplicationId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2";
const declinedApplicationId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";
const validationApplicationId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4";
const expectedOfferId = "6381366a-2775-4791-82d3-862ecb7e103f";
const declineReason = "The receivable does not meet the current simulated funding criteria.";
const requireNoError = (error, label) => {
  if (error) throw new Error(`${label}: ${error.message}`);
};

try {
  requireNoError(
    (
      await funder.auth.signInWithPassword({
        email: "funder.demo@proofflow.example",
        password,
      })
    ).error,
    "funder sign-in",
  );

  const { data: offer, error: offerError } = await funder
    .from("offers")
    .select(
      "id,status,decision_kind,invoice_amount_minor,advance_amount_minor,fee_amount_minor,net_advance_minor,advance_bps,fee_bps,decision_payload_hash",
    )
    .eq("id", expectedOfferId)
    .single();
  requireNoError(offerError, "accepted offer receipt");
  if (
    offer.id !== expectedOfferId ||
    offer.status !== "accepted" ||
    offer.decision_kind !== "offer" ||
    offer.invoice_amount_minor !== 2_240_000 ||
    offer.advance_amount_minor !== 1_792_000 ||
    offer.fee_amount_minor !== 44_800 ||
    offer.net_advance_minor !== 1_747_200 ||
    offer.advance_bps !== 8_000 ||
    offer.fee_bps !== 250 ||
    !offer.decision_payload_hash
  ) {
    throw new Error("The stored offer does not match the deterministic terms shown to the SME.");
  }

  const exactOfferReplay = await funder.rpc("create_funder_decision_v1", {
    target_application_id: offeredApplicationId,
    target_advance_bps: 8_000,
    target_fee_bps: 250,
    target_expiry_date: "2026-09-12",
    target_decline_reason: null,
  });
  requireNoError(exactOfferReplay.error, "exact offer replay");
  if (!exactOfferReplay.data.replayed || exactOfferReplay.data.offerId !== expectedOfferId) {
    throw new Error("The exact offer replay was not idempotent.");
  }

  const changedOffer = await funder.rpc("create_funder_decision_v1", {
    target_application_id: offeredApplicationId,
    target_advance_bps: 7_500,
    target_fee_bps: 250,
    target_expiry_date: "2026-09-12",
    target_decline_reason: null,
  });
  if (!changedOffer.error) throw new Error("A changed funder decision overwrote the immutable offer.");

  const directInsert = await funder.from("offers").insert({
    application_id: offeredApplicationId,
    funder_organization_id: "33333333-3333-4333-8333-333333333333",
    currency: "ZAR",
    advance_amount_minor: 1,
    fee_amount_minor: 0,
    net_advance_minor: 1,
    fee_bps: 0,
    advance_bps: 1,
    decision_kind: "offer",
  });
  if (!directInsert.error) throw new Error("A funder bypassed the decision RPC with a direct insert.");

  const { data: existingDecline, error: existingDeclineError } = await funder
    .from("offers")
    .select("id")
    .eq("application_id", declinedApplicationId)
    .maybeSingle();
  requireNoError(existingDeclineError, "existing decline lookup");
  if (!existingDecline) {
    const startedDecline = await funder.rpc("start_funder_review", {
      target_application_id: declinedApplicationId,
    });
    requireNoError(startedDecline.error, "start decline review");
  }
  const declined = await funder.rpc("create_funder_decision_v1", {
    target_application_id: declinedApplicationId,
    target_advance_bps: null,
    target_fee_bps: null,
    target_expiry_date: null,
    target_decline_reason: declineReason,
  });
  requireNoError(declined.error, "funder decline");

  const { data: declineReceipt, error: declineReceiptError } = await funder
    .from("offers")
    .select("id,status,decision_kind,response_reason,advance_amount_minor,fee_amount_minor,net_advance_minor,decision_payload_hash")
    .eq("id", declined.data.offerId)
    .single();
  requireNoError(declineReceiptError, "decline receipt");
  if (
    declineReceipt.status !== "declined" ||
    declineReceipt.decision_kind !== "decline" ||
    declineReceipt.response_reason !== declineReason ||
    declineReceipt.advance_amount_minor !== 0 ||
    declineReceipt.fee_amount_minor !== 0 ||
    declineReceipt.net_advance_minor !== 0 ||
    !declineReceipt.decision_payload_hash
  ) {
    throw new Error("The immutable funder decline receipt is incomplete.");
  }

  const exactDeclineReplay = await funder.rpc("create_funder_decision_v1", {
    target_application_id: declinedApplicationId,
    target_advance_bps: null,
    target_fee_bps: null,
    target_expiry_date: null,
    target_decline_reason: declineReason,
  });
  requireNoError(exactDeclineReplay.error, "exact decline replay");
  if (!exactDeclineReplay.data.replayed) throw new Error("The exact decline replay was not idempotent.");

  const validationReview = await funder.rpc("start_funder_review", {
    target_application_id: validationApplicationId,
  });
  requireNoError(validationReview.error, "start server-validation review");
  for (const invalidTerms of [
    { advance: -100, fee: 250, expiry: "2026-09-12" },
    { advance: 10_001, fee: 250, expiry: "2026-09-12" },
    { advance: 8_000, fee: 250, expiry: "2026-09-04" },
  ]) {
    const invalidOffer = await funder.rpc("create_funder_decision_v1", {
      target_application_id: validationApplicationId,
      target_advance_bps: invalidTerms.advance,
      target_fee_bps: invalidTerms.fee,
      target_expiry_date: invalidTerms.expiry,
      target_decline_reason: null,
    });
    if (!invalidOffer.error) throw new Error("Invalid simulated offer terms passed server validation.");
  }

  requireNoError(
    (
      await sme.auth.signInWithPassword({
        email: "sme.demo@proofflow.example",
        password,
      })
    ).error,
    "SME sign-in",
  );
  const acceptedReplay = await sme.rpc("respond_to_simulated_offer_v1", {
    target_offer_id: expectedOfferId,
    target_decision: "accept",
    target_reason: null,
  });
  requireNoError(acceptedReplay.error, "exact SME response replay");
  if (!acceptedReplay.data.replayed) throw new Error("The exact SME response replay was not idempotent.");

  const changedResponse = await sme.rpc("respond_to_simulated_offer_v1", {
    target_offer_id: expectedOfferId,
    target_decision: "decline",
    target_reason: "Changed after accepting.",
  });
  if (!changedResponse.error) throw new Error("The SME rewrote an immutable accepted response.");

  const fundingReplay = await sme.rpc("complete_simulated_funding", {
    target_offer_id: expectedOfferId,
  });
  requireNoError(fundingReplay.error, "simulated funding replay");
  if (!fundingReplay.data.replayed) throw new Error("The simulated funding replay was not idempotent.");

  const { data: application, error: applicationError } = await sme
    .from("applications")
    .select("status")
    .eq("id", offeredApplicationId)
    .single();
  requireNoError(applicationError, "funded application status");
  if (application.status !== "funded_simulated") {
    throw new Error("The application did not reach the explicit simulated funding state.");
  }

  const directUpdate = await sme
    .from("offers")
    .update({ response_reason: "Direct overwrite" })
    .eq("id", expectedOfferId)
    .select("id");
  if (!directUpdate.error && directUpdate.data.length !== 0) {
    throw new Error("The SME bypassed the response RPC with a direct update.");
  }

  requireNoError(
    (
      await buyer.auth.signInWithPassword({
        email: "buyer.demo@proofflow.example",
        password,
      })
    ).error,
    "buyer sign-in",
  );
  const wrongRole = await buyer.rpc("respond_to_simulated_offer_v1", {
    target_offer_id: expectedOfferId,
    target_decision: "accept",
    target_reason: null,
  });
  if (!wrongRole.error) throw new Error("A buyer account responded to an SME offer.");
  const wrongFunderRole = await buyer.rpc("create_funder_decision_v1", {
    target_application_id: validationApplicationId,
    target_advance_bps: 8_000,
    target_fee_bps: 250,
    target_expiry_date: "2026-09-12",
    target_decline_reason: null,
  });
  if (!wrongFunderRole.error) throw new Error("A buyer account created a funder decision.");

  for (const [applicationId, action] of [
    [offeredApplicationId, "funder.simulated_offer_created"],
    [offeredApplicationId, "sme.simulated_offer_accepted"],
    [offeredApplicationId, "application.simulated_funding_completed"],
    [declinedApplicationId, "funder.application_declined"],
  ]) {
    const { count, error } = await funder
      .from("audit_events")
      .select("id", { count: "exact", head: true })
      .eq("application_id", applicationId)
      .eq("action", action);
    requireNoError(error, `audit ${action}`);
    if (count !== 1) throw new Error(`Audit event ${action} is missing or duplicated.`);
  }

  process.stdout.write(
    "Hosted funder offer, decline, SME response, deterministic math, replay, tamper, RLS, role, and audit checks passed.\n",
  );
} finally {
  await funder.auth.signOut();
  await sme.auth.signOut();
  await buyer.auth.signOut();
}
