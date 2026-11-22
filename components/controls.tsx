"use client";

import React from "react";
import { useTheme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import { Sun, Moon } from "lucide-react";

const base =
  "inline-flex h-9 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-foreground dark:text-zinc-400 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-100 cursor-pointer";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`${base} w-9 ${className}`}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
    </button>
  );
}

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useI18n();

  return (
    <button
      type="button"
      onClick={() => setLang(lang === "en" ? "fil" : "en")}
      className={`${base} gap-0.5 px-2 text-[12px] font-semibold tracking-wide ${className}`}
      aria-label={lang === "en" ? "Palitan sa Filipino" : "Switch to English"}
      title="Palitan ang wika / Change language"
    >
      <span className={lang === "en" ? "text-foreground" : "text-zinc-400 dark:text-zinc-500"}>EN</span>
      <span className="text-zinc-300 dark:text-zinc-600" aria-hidden="true">/</span>
      <span className={lang === "fil" ? "text-foreground" : "text-zinc-400 dark:text-zinc-500"}>FIL</span>
    </button>
  );
}
