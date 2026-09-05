import type { Metadata } from "next";
import { BuyerDashboard } from "@/features/dashboard/buyer-dashboard";
import { FunderDashboard } from "@/features/dashboard/funder-dashboard";
import { SmeDashboard } from "@/features/dashboard/sme-dashboard";
import { requireRole } from "@/lib/auth/dal";
import { getDashboard } from "@/lib/dashboard/repository";
export const metadata:Metadata={title:"Overview"};
export default async function DashboardPage(){const user=await requireRole(["sme", "buyer", "funder"]);const data=await getDashboard(user);if(data.role==="buyer")return <BuyerDashboard data={data}/>;if(data.role==="funder")return <FunderDashboard data={data}/>;return <SmeDashboard data={data}/>;}
