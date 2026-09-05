import "server-only";

import { extractDocumentWithGemini, ExtractionProviderError } from "@/lib/ai/gemini-extractor";
import { requireApplicationAccess, requireRole } from "@/lib/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const bucket = "application-documents";
type Result = { ok: true } | { ok: false; code: string; message: string };

export async function extractPrivateDocument(documentId: unknown): Promise<Result> {
  const parsedId = z.uuid().safeParse(documentId);
  if (!parsedId.success) return { ok: false, code: "DOCUMENT_UNAVAILABLE", message: "The document could not be identified." };
  const session = await requireRole("sme");
  const supabase = await createClient();
  const { data: document, error } = await supabase.from("documents")
    .select("id,application_id,kind,mime_type,storage_path,upload_completed_at,extraction_status")
    .eq("id", parsedId.data).maybeSingle();
  if (error || !document?.upload_completed_at) return { ok: false, code: "DOCUMENT_UNAVAILABLE", message: "The completed document is unavailable." };
  const { application } = await requireApplicationAccess(document.application_id);
  if (application.owner_organization_id !== session.organizationId || !["documents_uploaded", "fields_extracted"].includes(application.status)) {
    return { ok: false, code: "APPLICATION_LOCKED", message: "This application is not ready for extraction." };
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return { ok: false, code: "MODEL_UNAVAILABLE", message: "Live extraction is not configured yet." };
  }

  const { data: blob, error: downloadError } = await supabase.storage.from(bucket).download(document.storage_path);
  if (downloadError || !blob) return { ok: false, code: "DOCUMENT_UNAVAILABLE", message: "The private document could not be read." };

  await admin.from("documents").update({ extraction_status: "processing", extraction_error_code: null }).eq("id", document.id);
  try {
    const extraction = await extractDocumentWithGemini({
      kind: document.kind,
      mimeType: document.mime_type as "application/pdf" | "image/jpeg" | "image/png",
      bytes: new Uint8Array(await blob.arrayBuffer()),
    });
    const { error: persistError } = await admin.rpc("persist_document_extraction_v1", {
      target_document_id: document.id,
      target_actor_profile_id: session.id,
      raw_extraction: extraction.extraction,
      normalized_fields: extraction.normalizedFields,
      provider_model: extraction.model,
      provider_metadata: extraction.metadata,
    });
    if (persistError) {
      await admin.from("documents").update({ extraction_status: "failed", extraction_error_code: "SAVE_FAILED" }).eq("id", document.id);
      return { ok: false, code: "SAVE_FAILED", message: "The extracted fields could not be saved. Please retry." };
    }
    return { ok: true };
  } catch (error) {
    const code = error instanceof ExtractionProviderError ? error.code : "MODEL_UNAVAILABLE";
    await admin.from("documents").update({ extraction_status: "failed", extraction_error_code: code }).eq("id", document.id);
    return { ok: false, code, message: code === "INVALID_MODEL_OUTPUT" ? "The AI response was not safe to use. Please retry." : "Live extraction is temporarily unavailable. Please retry." };
  }
}
