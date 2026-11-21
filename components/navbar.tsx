"use client";

import React from "react";
import Link from "next/link";
import { LibrePrintLogo } from "./logo";
import { ThemeToggle, LanguageToggle } from "./controls";
import { useI18n } from "@/lib/i18n";
import { Shield, UploadCloud } from "lucide-react";

interface NavbarProps {
  currentPath?: string;
  isStaff?: boolean;
}

export function Navbar({ currentPath = "/upload", isStaff = false }: NavbarProps) {
  const { t } = useI18n();

  return (
    <header className="w-full bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand identity with bespoke logo */}
        <Link href="/upload" className="flex items-center gap-2 group">
          <LibrePrintLogo size={26} />
        </Link>

        {/* Navigation & Controls */}
        <div className="flex items-center gap-2 sm:gap-3 text-sm">
          <Link
            href="/upload"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              currentPath === "/upload"
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">{t("upload_nav")}</span>
          </Link>

          {isStaff && <Link
            href="/staff/dashboard"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              currentPath.startsWith("/staff")
                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            }`}
          >
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span>{t("staff_nav")}</span>
          </Link>}

          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />

          {/* Language Toggle (Accessibility feature: Filipino friendly) */}
          <LanguageToggle />

          {/* Dark / Light Mode Toggle */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
