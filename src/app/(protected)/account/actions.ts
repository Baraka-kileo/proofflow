"use server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/dal";
import { demoCoupaScenarios } from "@/lib/integrations/demo-coupa";
import { createClient } from "@/lib/supabase/server";
export type ConnectionActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};
export async function changeDemoCoupaScenario(
  connectionId: string,
  previous: ConnectionActionState,
  formData: FormData,
): Promise<ConnectionActionState> {
  void previous;
  await requireRole("buyer");
  const parsed = z
    .object({ connectionId: z.uuid(), scenario: z.enum(demoCoupaScenarios) })
    .safeParse({ connectionId, scenario: formData.get("scenario") });
  if (!parsed.success)
    return { status: "error", message: "Choose a valid scenario." };
  const db = (await createClient()) as unknown as SupabaseClient;
  const { error } = await db.rpc("set_demo_coupa_scenario", {
    target_connection_id: parsed.data.connectionId,
    target_scenario: parsed.data.scenario,
  });
  if (error)
    return {
      status: "error",
      message: "The Demo Coupa scenario could not be changed.",
    };
  revalidatePath("/account");
  return { status: "success", message: "Demo scenario updated." };
}
