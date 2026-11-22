"use client";

import React from "react";
import Link from "next/link";
import { LibrePrintLogo } from "./logo";
import { ThemeToggle, LanguageToggle } from "./controls";
import { useI18n } from "@/shared/lib/i18n";
import { Shield, UploadCloud } from "lucide-react";

interface NavbarProps {
  currentPath?: string;
  isStaff?: boolean;
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors ${
        active
          ? "text-foreground bg-accent"
          : "text-muted-foreground hover:text-foreground dark:hover:text-zinc-100 hover:bg-accent"
      }`}
    >
      {children}
    </Link>
  );
}

export function Navbar({ currentPath = "/upload", isStaff = false }: NavbarProps) {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-card/90 backdrop-blur-md dark:border-zinc-800">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/upload" className="flex items-center gap-2 rounded-md">
          <LibrePrintLogo size={26} />
        </Link>

        <nav className="flex items-center gap-1 sm:gap-1.5" aria-label="Main">
          <NavLink href="/upload" active={currentPath === "/upload"}>
            <UploadCloud className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">{t("upload_nav")}</span>
            <span className="sr-only sm:hidden">{t("upload_nav")}</span>
          </NavLink>

          {isStaff && (
            <NavLink href="/staff/dashboard" active={currentPath.startsWith("/staff")}>
              <Shield className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{t("staff_nav")}</span>
            </NavLink>
          )}

          <span className="mx-1.5 h-5 w-px bg-zinc-200 dark:bg-zinc-800" aria-hidden="true" />

          <LanguageToggle />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
