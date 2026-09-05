"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  confirmationSubmissionSchema,
  parseJsonObject,
} from "@/lib/confirmations/confirmation-v1";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export type ConfirmationActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export async function submitBuyerConfirmation(
  previous: ConfirmationActionState,
  formData: FormData,
): Promise<ConfirmationActionState> {
  void previous;
  await requireRole("buyer");
  const parsed = confirmationSubmissionSchema.safeParse({
    confirmationId: formData.get("confirmationId"),
    answers: parseJsonObject(formData.get("answers")),
    explanations: parseJsonObject(formData.get("explanations")),
    jobTitle: emptyToNull(formData.get("jobTitle")),
    declarationVersion: emptyToNull(formData.get("declarationVersion")),
    signatureStrokes: parseJsonObject(formData.get("signatureStrokes")),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues)
      fieldErrors[issue.path.join(".") || "form"] ??= issue.message;
    return {
      status: "error",
      message: "Review the highlighted confirmation details.",
      fieldErrors,
    };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_buyer_confirmation_v1", {
    target_confirmation_id: parsed.data.confirmationId,
    submitted_answers: parsed.data.answers,
    submitted_explanations: parsed.data.explanations,
    submitted_job_title: parsed.data.jobTitle ?? undefined,
    submitted_declaration_version: parsed.data.declarationVersion ?? undefined,
    submitted_signature_strokes: parsed.data.signatureStrokes ?? undefined,
  });
  if (error) return { status: "error", message: publicMessage(error.message) };
  revalidatePath(`/confirmations/${parsed.data.confirmationId}`);
  revalidatePath("/dashboard");
  redirect(`/confirmations/${parsed.data.confirmationId}?submitted=1`);
}

function emptyToNull(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
function publicMessage(message: string) {
  if (message.includes("already has"))
    return "This request already has an immutable decision. Reload to view it.";
  if (message.includes("verified corporate"))
    return "Your signed-in email must be verified before you can sign for the large customer.";
  if (message.includes("Explain each"))
    return "Add a short explanation for every No answer.";
  return "The complete customer decision was not saved. Nothing changed; reload and try again.";
}
