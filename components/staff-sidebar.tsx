"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LibrePrintLogo } from "./logo";
import { ThemeToggle, LanguageToggle } from "./controls";
import { useI18n } from "@/lib/i18n";
import {
  Inbox,
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
      title: t("desk_title"),
      href: "/staff/dashboard",
      icon: <Inbox className="w-4 h-4 shrink-0" />,
      active: pathname.startsWith("/staff/dashboard"),
    },
    {
      title: t("upload_nav"),
      href: "/upload",
      icon: <UploadCloud className="w-4 h-4 shrink-0" />,
      active: pathname === "/upload",
    },
  ];

  return (
    <div className="min-h-screen flex bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
        />
      )}

      {/* shadcn Desktop & Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-200 md:static ${
          collapsed ? "w-16" : "w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Sidebar Header */}
        <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 px-4 flex items-center justify-between">
          <Link href="/staff/dashboard" className="flex items-center gap-2 overflow-hidden">
            <LibrePrintLogo size={24} showText={!collapsed} />
          </Link>

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:inline-flex p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 px-3 py-4 space-y-1">
          <div className={`px-2 mb-2 text-[10px] font-semibold tracking-wider uppercase text-zinc-400 ${collapsed ? "sr-only" : ""}`}>
            Operations
          </div>

          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                item.active
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
              }`}
              title={collapsed ? item.title : undefined}
            >
              {item.icon}
              {!collapsed && <span>{item.title}</span>}
            </Link>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-3 space-y-2">
          {!collapsed && (
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[11px] text-zinc-400">Settings</span>
              <div className="flex items-center gap-1">
                <LanguageToggle />
                <ThemeToggle />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer ${
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
        <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-1.5 -ml-1 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md"
            >
              <PanelLeft className="w-4 h-4" />
            </button>

            <span className="font-semibold text-zinc-900 dark:text-zinc-100">libreprint</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            <span>Staff Portal</span>
            {pathname.includes("/dashboard/") && (
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

            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>0.0.0.0:3000</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
