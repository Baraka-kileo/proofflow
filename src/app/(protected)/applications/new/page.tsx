import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { Card, CardContent } from "@/components/ui/card";
import { ApplicationDraftForm } from "@/features/applications/application-draft-form";
import { ApplicationTaskLayout } from "@/features/applications/application-task-layout";
import { deriveApplicationProgress } from "@/lib/applications/progress";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Start application" };

export default async function NewApplicationPage() {
  await requireRole("sme");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("id,name")
    .eq("kind", "buyer")
    .order("name");
  if (error)
    throw new Error(
      "Unable to load large customer organizations. Please try again.",
    );
  const minDate = new Date().toISOString().slice(0, 10);
  const progress = deriveApplicationProgress(null);
  return (
    <ApplicationTaskLayout {...progress}>
      <div className="page-enter">
        <PageHeading
          eyebrow="New application · Details"
          title="Start with the invoice story."
          description="Tell us who owes the invoice and when payment is expected. You will add the three supporting documents next."
        />
        <Card className="mt-10">
          <CardContent className="pt-6">
            <ApplicationDraftForm buyers={data ?? []} minDate={minDate} />
          </CardContent>
        </Card>
      </div>
    </ApplicationTaskLayout>
  );
}
