import { cookies } from "next/headers";
import { SIDEBAR_COOKIE, SidebarStoreProvider, StaffShell } from "@/features/staff";

// One shell for every staff page, so the sidebar keeps its state across navigation.
export default async function StaffDashboardLayout({ children }: { children: React.ReactNode }) {
  const collapsed = (await cookies()).get(SIDEBAR_COOKIE)?.value === "1";
  return (
    <SidebarStoreProvider initialCollapsed={collapsed}>
      <StaffShell>{children}</StaffShell>
    </SidebarStoreProvider>
  );
}
