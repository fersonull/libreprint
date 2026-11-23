// Self-check for translation files. Run: bun run shared/i18n/messages.check.ts
import { LANGUAGES, MESSAGES } from "./messages";
import languages from "./languages.json";

const en = MESSAGES.en;
const slots = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join();

console.assert(LANGUAGES.length === languages.length, "every language in languages.json is imported in messages.ts");
for (const [code, messages] of Object.entries(MESSAGES)) {
  const missing = Object.keys(en).filter((k) => !messages[k]);
  console.assert(missing.length === 0, `${code} has every key`, missing);
  const broken = Object.keys(en).filter((k) => messages[k] && slots(messages[k]) !== slots(en[k]));
  console.assert(broken.length === 0, `${code} keeps every {placeholder}`, broken);
}
console.log("messages ok", Object.fromEntries(Object.entries(MESSAGES).map(([c, m]) => [c, Object.keys(m).length])));
