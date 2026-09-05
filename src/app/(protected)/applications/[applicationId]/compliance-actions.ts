"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireApplicationAccess, requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export type ComplianceActionState = { status: "idle" | "error" | "success"; message?: string };

const schema = z.object({
  status: z.enum(["required","in_progress","additional_information_required","completed","unable_to_verify","expired"]),
  providerName: z.string().trim().max(120).optional(),
  externalReference: z.string().trim().max(160).optional(),
});

export async function recordExternalComplianceStatus(
  applicationId: string,
  previous: ComplianceActionState,
  formData: FormData,
): Promise<ComplianceActionState> {
  void previous;
  const id = z.uuid().safeParse(applicationId);
  const parsed = schema.safeParse({
    status: formData.get("status"),
    providerName: formData.get("providerName") || undefined,
    externalReference: formData.get("externalReference") || undefined,
  });
  if (!id.success || !parsed.success)
    return { status: "error", message: "Check the compliance status details and try again." };

  await requireRole("funder");
  await requireApplicationAccess(id.data);
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const { error } = await supabase.rpc("record_external_compliance_status_v1", {
    target_application_id: id.data,
    target_status: parsed.data.status,
    target_provider_name: parsed.data.providerName ?? null,
    target_external_reference: parsed.data.externalReference ?? null,
    target_completed_at: null,
    target_expires_at: null,
  });
  if (error) return { status: "error", message: "The funding partner status was not saved." };
  revalidatePath(`/applications/${id.data}`);
  return { status: "success", message: "Compliance progress recorded." };
}
