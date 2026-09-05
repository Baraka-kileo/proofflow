"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export type ResolutionState = {
  status: "idle" | "error" | "success";
  message?: string;
};
const inputSchema = z.object({
  checkId: z.uuid(),
  choice: z.enum(["external_value", "supplier_value", "other_issue"]),
  explanation: z.string().trim().max(500).optional(),
});

export async function resolveCoupaException(
  applicationId: string,
  choice: "external_value" | "supplier_value" | "other_issue",
  previous: ResolutionState,
  formData: FormData,
): Promise<ResolutionState> {
  void previous;
  await requireRole("buyer");
  const parsed = inputSchema.safeParse({
    checkId: formData.get("checkId"),
    choice,
    explanation: formData.get("explanation") || undefined,
  });
  if (
    !parsed.success ||
    (choice === "other_issue" && (parsed.data.explanation?.length ?? 0) < 3)
  )
    return {
      status: "error",
      message: "Add a short explanation for the issue.",
    };
  const client = (await createClient()) as unknown as SupabaseClient;
  const { error } = await client.rpc("resolve_coupa_exception_v1", {
    target_check_id: parsed.data.checkId,
    target_choice: parsed.data.choice,
    target_explanation: parsed.data.explanation ?? null,
  });
  if (error)
    return {
      status: "error",
      message:
        "This difference could not be saved. It may already be resolved.",
    };
  revalidatePath(`/applications/${applicationId}/system-evidence`);
  revalidatePath("/confirmations");
  revalidatePath("/dashboard");
  return {
    status: "success",
    message: choice === "other_issue" ? "Issue reported." : "Choice recorded.",
  };
}
