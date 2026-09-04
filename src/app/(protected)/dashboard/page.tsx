import type { Metadata } from "next";
import { BuyerDashboard } from "@/features/dashboard/buyer-dashboard";
import { FunderDashboard } from "@/features/dashboard/funder-dashboard";
import { SmeDashboard } from "@/features/dashboard/sme-dashboard";
import { getDemoDashboard } from "@/lib/demo/repository";
import { getDemoSession } from "@/lib/demo/session";
export const metadata:Metadata={title:"Overview"};
export default async function DashboardPage(){const user=await getDemoSession();const data=await getDemoDashboard(user.role);if(data.role==="buyer")return <BuyerDashboard data={data}/>;if(data.role==="funder")return <FunderDashboard data={data}/>;return <SmeDashboard data={data}/>;}
