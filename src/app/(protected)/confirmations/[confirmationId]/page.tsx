import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/page-heading";
import {
  BuyerConfirmationWorkflow,
  type ConfirmationFacts,
} from "@/features/confirmations/buyer-confirmation-workflow";
import {
  parseAnswers,
  parseSignature,
  type ConfirmationKey,
} from "@/lib/confirmations/confirmation-v1";
import { getUser, requireRole } from "@/lib/auth/dal";
import { presentLegacyFixtureLabel } from "@/lib/display/legacy-fixtures";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export const metadata: Metadata = { title: "Customer confirmation" };

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ confirmationId: string }>;
}) {
  const id = z.uuid().safeParse((await params).confirmationId);
  if (!id.success) notFound();
  const [session, user] = await Promise.all([
    requireRole(["sme", "buyer", "funder"]),
    getUser(),
  ]);
  const supabase = await createClient();
  const { data: confirmation, error } = await supabase
    .from("confirmations")
    .select(
      "*,application:applications!confirmations_application_id_fkey(id,status,purchase_order_reference,invoice_number,invoice_total_minor,invoice_due_on,currency,owner:organizations!applications_owner_organization_id_fkey(name),buyer:organizations!applications_buyer_organization_id_fkey(name),documents(id,kind,storage_path))",
    )
    .eq("id", id.data)
    .maybeSingle();
  if (error || !confirmation) notFound();
  if (
    confirmation.status === "pending" &&
    (session.role !== "buyer" ||
      session.organizationId !== confirmation.buyer_organization_id)
  )
    notFound();
  const latest = await supabase
    .from("verification_runs")
    .select("id")
    .eq("application_id", confirmation.application.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const checks = latest.data
    ? await supabase
        .from("verification_checks")
        .select("result")
        .eq("verification_run_id", latest.data.id)
    : { data: [], error: null };
  if (latest.error || checks.error)
    throw new Error("Unable to load the verification context.");
  const delivery = confirmation.application.documents.find(
    (document) => document.kind === "delivery_evidence",
  );
  const signed = delivery
    ? await supabase.storage
        .from("application-documents")
        .createSignedUrl(delivery.storage_path, 300)
    : { data: null, error: null };
  const amount = formatMoney(
    confirmation.application.invoice_total_minor,
    confirmation.application.currency,
  );
  const facts: ConfirmationFacts = {
    buyer: confirmation.application.buyer.name,
    supplier: confirmation.application.owner.name,
    purchaseOrder:
      confirmation.application.purchase_order_reference ?? "Not supplied",
    invoice: confirmation.application.invoice_number ?? "Not supplied",
    amount,
    outstanding: amount,
    paymentDate: confirmation.application.invoice_due_on
      ? new Intl.DateTimeFormat("en-ZA", {
          dateStyle: "long",
          timeZone: "Africa/Johannesburg",
        }).format(
          new Date(`${confirmation.application.invoice_due_on}T12:00:00+02:00`),
        )
      : "Not supplied",
  };
  const parsedAnswers = parseAnswers(confirmation.answers);
  const signature = parseSignature(confirmation.signature_strokes);
  const completed =
    confirmation.status !== "pending" &&
    parsedAnswers &&
    confirmation.decided_at &&
    confirmation.representative_name &&
    confirmation.representative_company &&
    confirmation.representative_email
      ? {
          status: confirmation.status as "confirmed" | "disputed",
          answers: parsedAnswers,
          explanations: parseExplanations(confirmation.answer_explanations),
          representativeName: confirmation.representative_name,
          representativeJobTitle: confirmation.representative_job_title,
          representativeCompany: presentLegacyFixtureLabel(
            confirmation.representative_company,
          ),
          representativeEmail: confirmation.representative_email,
          decidedAt: confirmation.decided_at,
          approvalId: confirmation.approval_id,
          signature,
        }
      : null;
  return (
    <div className="page-enter mx-auto max-w-7xl">
      <PageHeading
        eyebrow={`Customer request · ${confirmation.id.slice(0, 8).toUpperCase()}`}
        title={
          confirmation.status === "pending"
            ? "Confirm this receivable"
            : "Customer confirmation record"
        }
        description={
          confirmation.status === "pending"
            ? "Answer six questions, review your answers, then sign."
            : "This completed decision is read-only."
        }
      />
      <div className="mt-8">
        <BuyerConfirmationWorkflow
          confirmationId={confirmation.id}
          facts={facts}
          representative={{
            name: session.name,
            company: session.organization,
            email: user?.email ?? "Email unavailable",
            emailVerified: Boolean(user?.email_confirmed_at),
          }}
          deliveryPreviewUrl={signed.data?.signedUrl ?? null}
          warnings={
            (checks.data ?? []).filter((check) => check.result !== "pass")
              .length
          }
          completed={completed}
        />
      </div>
    </div>
  );
}

function formatMoney(minor: number | null, currency: string) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format((minor ?? 0) / 100);
}
function parseExplanations(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [ConfirmationKey, string] =>
        typeof entry[1] === "string",
    ),
  );
}
