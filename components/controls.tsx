"use client";

import React from "react";
import { useTheme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import { Sun, Moon, Languages } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer ${className}`}
      aria-label="Toggle dark mode"
      title={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {resolvedTheme === "dark" ? (
        <Sun className="w-4 h-4 text-zinc-200" />
      ) : (
        <Moon className="w-4 h-4 text-zinc-700" />
      )}
    </button>
  );
}

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useI18n();

  const toggleLang = () => {
    setLang(lang === "en" ? "fil" : "en");
  };

  return (
    <button
      type="button"
      onClick={toggleLang}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer ${className}`}
      aria-label="Toggle language"
      title="Palitan ang wika / Change language"
    >
      <Languages className="w-3.5 h-3.5 text-zinc-500" />
      <span className="font-semibold uppercase text-[11px]">
        {lang === "en" ? "FIL" : "EN"}
      </span>
    </button>
  );
}
