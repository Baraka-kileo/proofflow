import { AppShell } from "@/components/app-shell";
import { getDemoSession } from "@/lib/demo/session";

export default async function ProtectedLayout({ children }: { children:React.ReactNode }) {
  const user=await getDemoSession();
  return <AppShell user={user}>{children}</AppShell>;
}
