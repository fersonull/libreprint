import { cookies } from "next/headers";
import { SIDEBAR_COOKIE } from "@/features/staff/shell/sidebar-cookie";
import { SidebarStoreProvider } from "@/features/staff/shell/sidebar-store";
import { StaffShell } from "@/features/staff/shell/staff-shell";

// One shell for every staff page, so the sidebar keeps its state across navigation.
export default async function StaffDashboardLayout({ children }: { children: React.ReactNode }) {
  const collapsed = (await cookies()).get(SIDEBAR_COOKIE)?.value === "1";
  return (
    <SidebarStoreProvider initialCollapsed={collapsed}>
      <StaffShell>{children}</StaffShell>
    </SidebarStoreProvider>
  );
}
