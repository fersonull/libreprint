import languages from "./languages.json";
import en from "./locales/en.json";
import fil from "./locales/fil.json";

// To add a language: add it to languages.json, run `bun run translate <code>`, then import its file here.
export const MESSAGES: Record<string, Record<string, string>> = { en, fil };

export const LANGUAGES = languages.filter((l) => l.code in MESSAGES);

export type MessageKey = keyof typeof en;
