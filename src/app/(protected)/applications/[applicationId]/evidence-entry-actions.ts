"use server";

import { revalidatePath } from "next/cache";
import { requireApplicationAccess, requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export type EvidenceEntryActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

const enteredFieldsSchema = z
  .array(
    z
      .object({
        id: z.uuid(),
        value: z.union([z.string().max(300), z.boolean()]),
      })
      .strict(),
  )
  .length(21);

export async function startApplicationEvidenceEntry(
  applicationId: string,
  previous: EvidenceEntryActionState,
): Promise<EvidenceEntryActionState> {
  void previous;
  const parsed = z.uuid().safeParse(applicationId);
  if (!parsed.success)
    return { status: "error", message: "The application could not be identified." };

  const session = await requireRole("sme");
  const { application } = await requireApplicationAccess(parsed.data);
  if (
    application.owner_organization_id !== session.organizationId ||
    !["documents_uploaded", "fields_extracted"].includes(application.status)
  )
    return {
      status: "error",
      message: "This application is not ready for evidence entry.",
    };

  const supabase = await createClient();
  const { error } = await supabase.rpc("initialize_manual_evidence_v1", {
    target_application_id: application.id,
  });
  if (error) {
    if (error.code === "PGRST202")
      return {
        status: "error",
        message: "Evidence entry is not available yet. Ask the platform administrator to apply the latest database update.",
      };
    return {
      status: "error",
      message: "Evidence entry could not start. Reload the page and try again.",
    };
  }

  revalidatePath(`/applications/${application.id}`);
  return { status: "idle" };
}

export async function submitApplicationEvidence(
  applicationId: string,
  previous: EvidenceEntryActionState,
  formData: FormData,
): Promise<EvidenceEntryActionState> {
  void previous;
  const parsedApplication = z.uuid().safeParse(applicationId);
  if (!parsedApplication.success)
    return { status: "error", message: "The application could not be identified." };

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("enteredFields") ?? ""));
  } catch {
    return {
      status: "error",
      message: "The entered fields could not be read. Please reload and try again.",
    };
  }
  const parsedFields = enteredFieldsSchema.safeParse(raw);
  if (!parsedFields.success)
    return {
      status: "error",
      message: "Complete every field in the required format before submitting.",
    };

  const session = await requireRole("sme");
  const { application } = await requireApplicationAccess(parsedApplication.data);
  if (
    application.owner_organization_id !== session.organizationId ||
    !["fields_extracted", "sme_reviewed"].includes(application.status)
  )
    return {
      status: "error",
      message: "This application is not ready for evidence entry.",
    };

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_manual_evidence_v1", {
    target_application_id: application.id,
    entered_fields: parsedFields.data,
  });
  if (error)
    return {
      status: "error",
      message: "The evidence was not saved. Check every value and try again.",
    };

  revalidatePath(`/applications/${application.id}`);
  return {
    status: "success",
    message: "All 21 evidence fields were entered and saved.",
  };
}
