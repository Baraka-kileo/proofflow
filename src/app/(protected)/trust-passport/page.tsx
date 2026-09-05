import type { Metadata } from "next";
import { TrustPassportView } from "@/features/trust-passport/trust-passport-view";
import { requireRole } from "@/lib/auth/dal";
import { getTrustPassport } from "@/lib/trust-passport/repository";

export const metadata: Metadata = { title: "Trust Passport" };

export default async function TrustPassportPage() {
  const session = await requireRole("sme");
  const data = await getTrustPassport(session);
  return <TrustPassportView data={data} organization={session.organization} />;
}
