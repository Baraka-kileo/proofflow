import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BuyerConfirmationsView } from "@/features/dashboard/buyer-dashboard";
import { requireRole } from "@/lib/auth/dal";
import { getDashboard } from "@/lib/dashboard/repository";

export const metadata: Metadata = { title: "Confirmations" };

export default async function ConfirmationsPage() {
  const user = await requireRole("buyer");
  const data = await getDashboard(user);
  if (data.role !== "buyer") notFound();
  return <BuyerConfirmationsView data={data} />;
}
