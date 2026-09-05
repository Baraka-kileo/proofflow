import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FunderOffersView } from "@/features/dashboard/funder-dashboard";
import { requireRole } from "@/lib/auth/dal";
import { getDashboard } from "@/lib/dashboard/repository";

export const metadata: Metadata = { title: "Offers" };

export default async function OffersPage() {
  const user = await requireRole("funder");
  const data = await getDashboard(user);
  if (data.role !== "funder") notFound();
  return <FunderOffersView data={data} />;
}
