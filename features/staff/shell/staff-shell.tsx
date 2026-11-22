"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Printer, Inbox, UploadCloud, LogOut, PanelLeftClose, PanelLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { LibrePrintLogo } from "@/components/logo";
import { ThemeToggle, LanguageToggle } from "@/components/controls";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebarStore } from "./sidebar-store";

const NAV: { title: string; href: string; icon: typeof Printer; exact?: boolean }[] = [
  { title: "Overview", href: "/staff/dashboard", icon: LayoutDashboard, exact: true },
  { title: "Print desk", href: "/staff/dashboard/print-desk", icon: Printer },
  { title: "Transactions", href: "/staff/dashboard/transactions", icon: Inbox },
];

/** Shows the label as a tooltip only while the sidebar is collapsed to icons. */
function SideTip({ label, show, children }: { label: string; show: boolean; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      {show && (
        <TooltipContent side="right" sideOffset={8} className="hidden md:block">
          {label}
        </TooltipContent>
      )}
    </Tooltip>
  );
}

function Crumb({ pathname }: { pathname: string }) {
  const current = NAV.find((item) => item.href !== "/staff/dashboard" && pathname.startsWith(item.href));
  const isTicket = !current && pathname !== "/staff/dashboard";
  const label = current?.title ?? (isTicket ? "Ticket" : "Overview");
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
      <span className="text-muted-foreground">Staff</span>
      <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
      {isTicket ? (
        <>
          <Link href="/staff/dashboard/print-desk" className="text-muted-foreground hover:text-foreground">
            Print desk
          </Link>
          <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
        </>
      ) : null}
      <span className="truncate font-medium text-foreground" aria-current="page">
        {label}
      </span>
    </nav>
  );
}

export function StaffShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const collapsed = useSidebarStore((s) => s.isCollapsed);
  const mobileOpen = useSidebarStore((s) => s.isMobileOpen);
  const toggleCollapsed = useSidebarStore((s) => s.toggleCollapsed);
  const openMobile = useSidebarStore((s) => s.openMobile);
  const closeMobile = useSidebarStore((s) => s.closeMobile);

  const signOut = async () => {
    await fetch("/api/staff/auth", { method: "DELETE" });
    router.push("/staff/login");
    router.refresh();
  };

  const items = [...NAV, { title: t("upload_nav"), href: "/upload", icon: UploadCloud, exact: true }];
  // Collapsing is a desktop preference; the mobile drawer always shows labels.
  const label = collapsed ? "md:sr-only" : "";

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex min-h-screen bg-background text-foreground">
        {mobileOpen && <div onClick={closeMobile} className="fixed inset-0 z-40 bg-black/40 md:hidden" aria-hidden="true" />}

        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-sidebar transition-[width,translate] duration-200 md:sticky md:top-0 md:h-dvh md:translate-x-0",
            collapsed && "md:w-16",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className={cn("flex h-14 items-center justify-between gap-2 px-4", collapsed && "md:justify-center md:px-0")}>
            <Link href="/staff/dashboard" className={cn("flex items-center overflow-hidden", collapsed && "md:hidden")}>
              <LibrePrintLogo size={24} showText />
            </Link>
            <SideTip label="Expand sidebar" show={collapsed}>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={toggleCollapsed}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-expanded={!collapsed}
                className="hidden text-muted-foreground md:inline-flex"
              >
                {collapsed ? <PanelLeft /> : <PanelLeftClose />}
              </Button>
            </SideTip>
          </div>

          <nav className="flex flex-1 flex-col gap-1 px-3 py-3" aria-label="Staff">
            {items.map(({ title, href, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <SideTip key={href} label={title} show={collapsed}>
                  <Link
                    href={href}
                    onClick={closeMobile}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                      collapsed && "md:justify-center md:px-0",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    <span className={label}>{title}</span>
                  </Link>
                </SideTip>
              );
            })}
          </nav>

          <div className="flex flex-col gap-2 border-t p-3">
            <div className={cn("flex items-center gap-0.5 px-1", collapsed && "md:hidden")}>
              <LanguageToggle />
              <ThemeToggle />
            </div>
            <SideTip label={t("sign_out")} show={collapsed}>
              <button
                type="button"
                onClick={signOut}
                className={cn(
                  "flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors outline-none hover:bg-destructive/10 hover:text-destructive focus-visible:ring-3 focus-visible:ring-ring/50",
                  collapsed && "md:justify-center md:px-0"
                )}
              >
                <LogOut className="size-4 shrink-0" aria-hidden="true" />
                <span className={label}>{t("sign_out")}</span>
              </button>
            </SideTip>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b bg-background/90 px-4 backdrop-blur-md sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <Button variant="ghost" size="icon" onClick={openMobile} aria-label="Open menu" className="-ml-2 md:hidden">
                <PanelLeft />
              </Button>
              <Crumb pathname={pathname} />
            </div>
            <div className="flex items-center gap-1 md:hidden">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </header>
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
