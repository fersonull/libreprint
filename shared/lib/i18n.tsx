"use client";

import React, { createContext, useContext, useEffect, useSyncExternalStore } from "react";
import { LANGUAGES, MESSAGES } from "@/shared/i18n/messages";

// Strings live in shared/i18n/locales/*.json; `bun run translate` fills in other languages from English.
export type Language = string;

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const STORAGE_KEY = "libreprint_lang";
const listeners = new Set<() => void>();

function readLang(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved in MESSAGES) return saved;
  } catch {
    // Storage blocked: fall back to English.
  }
  return "en";
}

function setLang(lang: Language) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Storage blocked: the choice lasts for this page only.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function translate(lang: Language, key: string): string {
  return MESSAGES[lang]?.[key] || MESSAGES.en[key] || key;
}

const I18nContext = createContext<I18nContextType>({
  lang: "en",
  setLang: () => {},
  t: (key) => translate("en", key),
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const lang = useSyncExternalStore(subscribe, readLang, () => "en");

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t: (key) => translate(lang, key) }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export { LANGUAGES };
