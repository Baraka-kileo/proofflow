"use client";

import { useActionState } from "react";
import { AlertTriangle, CheckCircle2, HandCoins, Landmark } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/status-badge";
import {
  respondToFundingProposal,
  type OfferResponseState,
} from "@/app/(protected)/offers/[offerId]/actions";

type Props = {
  offerId: string;
  role: "sme" | "funder";
  status: "draft" | "offered" | "accepted" | "declined" | "expired";
  decisionKind: string;
  supplier: string;
  buyer: string;
  invoice: string;
  currency: string;
  invoiceMinor: number;
  advanceMinor: number;
  feeMinor: number;
  netMinor: number;
  advanceBps: number;
  feeBps: number;
  dueDate: string;
  expiresAt: string;
  responseReason: string | null;
  applicationStatus: string;
};
const initial: OfferResponseState = { status: "idle" };

export function OfferReceipt(props: Props) {
  const [responseState, responseAction, responsePending] = useActionState(
    respondToFundingProposal,
    initial,
  );
  const funderDeclined = props.decisionKind === "decline";
  const expired =
    props.status === "offered" && new Date(props.expiresAt) <= new Date();
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--review-soft)] px-3 py-1 text-xs font-bold text-[var(--review)]">
                <HandCoins className="size-4" />
                Funding proposal
              </span>
              <h2 className="mt-4 text-2xl font-bold">
                {funderDeclined
                  ? "Application declined"
                  : props.status === "offered"
                    ? "Funding proposal ready"
                    : props.status === "accepted"
                      ? "Funding proposal accepted"
                      : props.status === "declined"
                        ? "Funding proposal declined"
                        : "Funding proposal expired"}
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {props.supplier} · {props.invoice}
              </p>
            </div>
            <StatusBadge
              status={
                props.status === "accepted"
                  ? "success"
                  : props.status === "offered" && !expired
                    ? "review"
                    : "error"
              }
            >
              {expired ? "expired" : props.status}
            </StatusBadge>
          </div>
          {funderDeclined ? (
            <Alert tone="error" title="Funder decision" className="mt-6">
              <p>{props.responseReason}</p>
            </Alert>
          ) : (
            <>
              <dl className="mt-7 divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)]">
                <Term
                  label="Invoice value"
                  value={money(props.invoiceMinor, props.currency)}
                />
                <Term
                  label={`Gross advance · ${percent(props.advanceBps)}`}
                  value={money(props.advanceMinor, props.currency)}
                />
                <Term
                  label={`Fee · ${percent(props.feeBps)} of advance`}
                  value={`− ${money(props.feeMinor, props.currency)}`}
                />
                <Term
                  label="Estimated net advance"
                  value={money(props.netMinor, props.currency)}
                  strong
                />
                <Term
                  label="Expected customer payment"
                  value={formatDate(props.dueDate)}
                />
                <Term
                  label="Offer expires"
                  value={formatTime(props.expiresAt)}
                />
              </dl>
              <div className="mt-6 rounded-2xl bg-[var(--soft)] p-5">
                <div className="flex items-center gap-2 font-bold">
                  <Landmark className="size-5 text-[var(--primary)]" />
                  How the proposal is calculated
                </div>
                <ol className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
                  <li>
                    <b className="text-[var(--ink)]">1.</b> The funder advances
                    the estimated net advance.
                  </li>
                  <li>
                    <b className="text-[var(--ink)]">2.</b> {props.buyer} still
                    settles the invoice on its expected date.
                  </li>
                  <li>
                    <b className="text-[var(--ink)]">3.</b> ProofFlow records
                    the journey; it does not move money or create a credit
                    agreement.
                  </li>
                </ol>
              </div>
            </>
          )}
          {responseState.status === "error" && (
            <Alert tone="error" title="Response not saved" className="mt-5">
              <p>{responseState.message}</p>
            </Alert>
          )}
        </CardContent>
      </Card>
      <aside>
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold">
              {props.role === "sme" ? "Your response" : "Decision receipt"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {props.role === "sme"
                ? "Review the complete terms before choosing once."
                : "Terms and responses are immutable after submission."}
            </p>
            {props.role === "sme" && props.status === "offered" && !expired && (
              <div className="mt-5 space-y-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <CheckCircle2 className="size-4" />
                      Accept funding proposal
                    </Button>
                  </DialogTrigger>
                  <DialogContent
                    title="Accept this funding proposal?"
                    description="This records your response to the funder's proposal. The funding partner remains responsible for contracting and disbursement."
                  >
                    <form action={responseAction}>
                      <input
                        type="hidden"
                        name="offerId"
                        value={props.offerId}
                      />
                      <input type="hidden" name="decision" value="accept" />
                      <input type="hidden" name="reason" value="" />
                      <div className="rounded-xl bg-[var(--soft)] p-4 text-sm">
                        <p>Estimated net advance</p>
                        <strong className="mt-1 block text-xl text-[var(--primary)]">
                          {money(props.netMinor, props.currency)}
                        </strong>
                      </div>
                      <div className="mt-5 flex justify-end gap-3">
                        <DialogClose asChild>
                          <Button type="button" variant="secondary">
                            Go back
                          </Button>
                        </DialogClose>
                        <Button type="submit" loading={responsePending}>
                          Accept once
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="secondary"
                      className="w-full text-[var(--error)]"
                    >
                      <AlertTriangle className="size-4" />
                      Decline offer
                    </Button>
                  </DialogTrigger>
                  <DialogContent
                    title="Decline this funding proposal?"
                    description="Your reason will be recorded for the funder and cannot be edited later."
                  >
                    <form action={responseAction}>
                      <input
                        type="hidden"
                        name="offerId"
                        value={props.offerId}
                      />
                      <input type="hidden" name="decision" value="decline" />
                      <label
                        htmlFor="sme-decline-reason"
                        className="text-sm font-bold"
                      >
                        Reason
                      </label>
                      <textarea
                        id="sme-decline-reason"
                        name="reason"
                        required
                        minLength={3}
                        maxLength={500}
                        rows={4}
                        className="mt-2 w-full rounded-xl border border-[var(--border)] p-3 text-sm"
                      />
                      <div className="mt-5 flex justify-end gap-3">
                        <DialogClose asChild>
                          <Button type="button" variant="secondary">
                            Go back
                          </Button>
                        </DialogClose>
                        <Button
                          type="submit"
                          variant="danger"
                          loading={responsePending}
                        >
                          Decline once
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}
            {props.role === "sme" && props.status === "accepted" && props.applicationStatus === "offer_accepted" && (
              <Alert title="Awaiting funding partner confirmation" className="mt-5"><p>Acceptance is recorded. Any disbursement must be completed and confirmed by the regulated funding partner.</p></Alert>
            )}
            {props.applicationStatus === "funded_simulated" && (
              <Alert
                tone="success"
                title="Funding partner confirmation recorded"
                className="mt-5"
              >
                <p>
                  A funding-partner confirmation is recorded for this historical transaction.
                </p>
              </Alert>
            )}
            {props.status === "declined" && !funderDeclined && (
              <Alert tone="error" title="SME declined" className="mt-5">
                <p>{props.responseReason}</p>
              </Alert>
            )}
            {expired && (
              <Alert tone="error" title="Offer expired" className="mt-5">
                <p>This offer can no longer be accepted.</p>
              </Alert>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function Term({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-5 p-4">
      <dt className="text-sm text-[var(--muted)]">{label}</dt>
      <dd
        className={
          strong ? "text-lg font-extrabold text-[var(--primary)]" : "font-bold"
        }
      >
        {value}
      </dd>
    </div>
  );
}
function money(minor: number, currency: string) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(minor / 100);
}
function percent(bps: number) {
  return `${(bps / 100).toFixed(bps % 100 ? 2 : 0)}%`;
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "long",
    timeZone: "Africa/Johannesburg",
  }).format(new Date(`${value}T12:00:00+02:00`));
}
function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Johannesburg",
  }).format(new Date(value));
}
