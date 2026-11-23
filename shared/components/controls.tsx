"use client";

import React from "react";
import { useTheme } from "@/shared/lib/theme";
import { LANGUAGES, useI18n } from "@/shared/lib/i18n";
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
  const index = Math.max(0, LANGUAGES.findIndex((l) => l.code === lang));
  const next = LANGUAGES[(index + 1) % LANGUAGES.length];

  return (
    <button
      type="button"
      onClick={() => setLang(next.code)}
      className={`${base} gap-0.5 px-2 text-[12px] font-semibold tracking-wide ${className}`}
      aria-label={`${LANGUAGES[index].name}. Switch to ${next.name}`}
      title={`Switch to ${next.name}`}
    >
      {LANGUAGES.map((l, i) => (
        <React.Fragment key={l.code}>
          {i > 0 && <span className="text-zinc-300 dark:text-zinc-600" aria-hidden="true">/</span>}
          <span className={l.code === lang ? "text-foreground" : "text-zinc-400 dark:text-zinc-500"}>{l.label}</span>
        </React.Fragment>
      ))}
    </button>
  );
}
