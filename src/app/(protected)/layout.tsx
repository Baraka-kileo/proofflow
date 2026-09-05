import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth/dal";

export default async function ProtectedLayout({ children }: { children:React.ReactNode }) {
  const user=await requireRole(["sme", "buyer", "funder"]);
  return <AppShell user={user}>{children}</AppShell>;
}
