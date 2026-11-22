"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LibrePrintLogo } from "./logo";
import { ThemeToggle, LanguageToggle } from "./controls";
import { useI18n } from "@/lib/i18n";
import {
  Inbox,
  BarChart3,
  UploadCloud,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  ChevronRight,
  Printer,
} from "lucide-react";

interface StaffSidebarLayoutProps {
  children: React.ReactNode;
}

export function StaffSidebarLayout({ children }: StaffSidebarLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/staff/auth", { method: "DELETE" });
    router.push("/staff/login");
    router.refresh();
  };

  const navItems = [
    {
      title: "Analytics",
      href: "/staff/dashboard",
      icon: <BarChart3 className="w-4 h-4 shrink-0" />,
      active: pathname === "/staff/dashboard",
    },
    {
      title: "Staff Print Desk",
      href: "/staff/dashboard/print-desk",
      icon: <Printer className="w-4 h-4 shrink-0" />,
      active: pathname.startsWith("/staff/dashboard/print-desk"),
    },
    {
      title: "Transactions",
      href: "/staff/dashboard/transactions",
      icon: <Inbox className="w-4 h-4 shrink-0" />,
      active: pathname.startsWith("/staff/dashboard/transactions"),
    },
    {
      title: t("upload_nav"),
      href: "/upload",
      icon: <UploadCloud className="w-4 h-4 shrink-0" />,
      active: pathname === "/upload",
    },
  ];

  return (
    <div className="min-h-screen flex text-foreground">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-zinc-950/50 md:hidden"
        />
      )}

      {/* shadcn Desktop & Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r border-border transition-[width,transform] duration-200 md:sticky md:top-0 md:bottom-auto md:h-dvh md:self-start ${
          collapsed ? "w-16" : "w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Sidebar Header */}
        <div className="h-14 px-4 flex items-center justify-between">
          <Link href="/staff/dashboard" className="flex items-center gap-2 overflow-hidden">
            <LibrePrintLogo size={24} showText={!collapsed} />
          </Link>

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:inline-flex p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md hover:bg-accent transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-3 space-y-0.5" aria-label="Staff">

          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              onClick={() => setMobileOpen(false)}
              className={`flex h-10 items-center gap-3 px-3 rounded-lg text-[13px] font-medium transition-colors ${
                item.active
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground dark:hover:text-zinc-100 hover:bg-accent"
              }`}
              title={collapsed ? item.title : undefined}
            >
              {item.icon}
              {!collapsed && <span>{item.title}</span>}
            </Link>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-border p-3 space-y-2">
          {!collapsed && (
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-0.5">
                <LanguageToggle />
                <ThemeToggle />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className={`w-full flex h-10 items-center gap-3 px-3 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer ${
              collapsed ? "justify-center" : ""
            }`}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{t("sign_out")}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header / Breadcrumb Bar */}
        <header className="h-14 border-b border-border bg-card/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex min-w-0 items-center gap-2 text-[13px] text-zinc-500">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="md:hidden inline-flex h-9 w-9 -ml-2 items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-accent rounded-lg"
            >
              <PanelLeft className="w-4 h-4" />
            </button>

            <span className="font-semibold text-foreground">Staff</span>
            {pathname === "/staff/dashboard/print-desk" && <><ChevronRight className="w-3.5 h-3.5 text-zinc-400" /><span>Staff Print Desk</span></>}
            {pathname === "/staff/dashboard/transactions" && <><ChevronRight className="w-3.5 h-3.5 text-zinc-400" /><span>Transactions</span></>}
            {pathname.match(/^\/staff\/dashboard\/[^/]+$/) && !["/staff/dashboard/print-desk", "/staff/dashboard/transactions"].includes(pathname) && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                <span className="font-mono text-zinc-800 dark:text-zinc-200 font-semibold">
                  Ticket View
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="md:hidden flex items-center gap-1">
              <LanguageToggle />
              <ThemeToggle />
            </div>

            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground" title="Queue refreshes automatically">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 animate-pulse-subtle" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Live
            </span>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
