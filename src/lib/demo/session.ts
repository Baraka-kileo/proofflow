import "server-only";

import type { Role, SessionUser } from "@/types/domain";

const demoUsers: Record<Role, SessionUser> = {
  sme: { id: "demo-sme", name: "Amara Ndlovu", organization: "Ndlovu Office Supply", role: "sme" },
  buyer: { id: "demo-buyer", name: "Lebo Molefe", organization: "Ubuntu Retail Group", role: "buyer" },
  funder: { id: "demo-funder", name: "Thandi Khumalo", organization: "Demo Capital", role: "funder" },
};

export async function getDemoSession(role: Role = "sme"): Promise<SessionUser> {
  return demoUsers[role];
}
