import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FunderApplicationsView } from "@/features/dashboard/funder-dashboard";
import { SmeApplicationsView } from "@/features/dashboard/sme-dashboard";
import { requireRole } from "@/lib/auth/dal";
import { getDashboard } from "@/lib/dashboard/repository";

export const metadata: Metadata = { title: "Applications" };

export default async function ApplicationsPage() {
  const user = await requireRole(["sme", "funder"]);
  const data = await getDashboard(user);
  if (data.role === "funder") return <FunderApplicationsView data={data} />;
  if (data.role === "sme") return <SmeApplicationsView data={data} />;
  notFound();
}
