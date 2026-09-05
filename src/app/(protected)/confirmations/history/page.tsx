import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BuyerHistoryView } from "@/features/dashboard/buyer-dashboard";
import { requireRole } from "@/lib/auth/dal";
import { getDashboard } from "@/lib/dashboard/repository";

export const metadata: Metadata = { title: "Decision history" };

export default async function BuyerHistoryPage() {
  const user = await requireRole("buyer");
  const data = await getDashboard(user);
  if (data.role !== "buyer") notFound();
  return <BuyerHistoryView data={data} />;
}
