// Machine-translates shared/i18n/locales/en.json into the other languages with Meta's
// NLLB model, running locally. The model (~600 MB) downloads once into .cache/models;
// after that this works offline. Hand-written strings in shared/i18n/overrides/<code>.json
// always win over the machine translation.
//
//   bun run translate               all languages in languages.json
//   bun run translate fil           just Filipino
//   bun run translate fil --no-overrides --out <dir>   pure machine output, e.g. to compare
import fs from "node:fs";
import path from "node:path";
import { env, pipeline } from "@huggingface/transformers";

const I18N = path.join(import.meta.dirname, "..", "shared", "i18n");
const MODEL = "Xenova/nllb-200-distilled-600M";
env.cacheDir = path.join(import.meta.dirname, "..", ".cache", "models");

const args = process.argv.slice(2);
const noOverrides = args.includes("--no-overrides");
const outIndex = args.indexOf("--out");
const outDir = outIndex >= 0 ? args[outIndex + 1] : path.join(I18N, "locales");
const wanted = args.filter((a, i) => !a.startsWith("--") && (outIndex < 0 || i !== outIndex + 1));

const readJson = (file: string) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {});
const languages: { code: string; name: string; nllb: string }[] = readJson(path.join(I18N, "languages.json"));
const source: Record<string, string> = readJson(path.join(I18N, "locales", "en.json"));
const sourceLang = languages.find((l) => l.code === "en")!;
const targets = languages.filter((l) => l.code !== "en" && (wanted.length === 0 || wanted.includes(l.code)));
if (targets.length === 0) throw new Error(`No such language in languages.json: ${wanted.join(", ")}`);

// {placeholders} must survive translation untouched, so they travel as numbered tokens.
const PLACEHOLDER = /\{(\w+)\}/g;
const placeholders = (text: string) => [...text.matchAll(PLACEHOLDER)].map((m) => m[0]).sort().join();

let translator: Awaited<ReturnType<typeof pipeline<"translation">>> | null = null;

for (const lang of targets) {
  const overrides: Record<string, string> = noOverrides ? {} : readJson(path.join(I18N, "overrides", `${lang.code}.json`));
  const todo = Object.keys(source).filter((key) => !(key in overrides));
  const result: Record<string, string> = {};
  console.log(`${lang.name}: ${Object.keys(source).length - todo.length} hand-written, ${todo.length} to machine-translate`);

  if (todo.length > 0) {
    translator ??= await pipeline("translation", MODEL, {
      dtype: "q8",
      progress_callback: (p: { status: string; file?: string; progress?: number }) => {
        if (p.status === "progress" && p.progress !== undefined) process.stdout.write(`\r  downloading ${p.file} ${p.progress.toFixed(0)}%   `);
        if (p.status === "done") process.stdout.write("\n");
      },
    });
  }

  for (const [i, key] of todo.entries()) {
    const english = source[key];
    const names: string[] = [];
    const masked = english.replace(PLACEHOLDER, (m) => `[${names.push(m) - 1}]`);
    // NLLB tends to drop every sentence after the first, so each one is translated on its own.
    const sentences = masked.split(/(?<=[.!?])\s+/);
    const outs = (await translator!(sentences, { src_lang: sourceLang.nllb, tgt_lang: lang.nllb } as never)) as { translation_text: string }[];
    const text = outs
      .map((o) => o.translation_text)
      .join(" ")
      .replace(/\[(\d+)\]/g, (m, n) => names[Number(n)] ?? m);
    if (placeholders(text) !== placeholders(english)) {
      console.warn(`\n  ${key}: placeholders got lost, keeping English. Add a hand-written override for it.`);
      result[key] = english;
    } else {
      result[key] = text;
    }
    process.stdout.write(`\r  ${i + 1}/${todo.length}`);
  }
  if (todo.length > 0) process.stdout.write("\n");

  // Same key order as English, so diffs stay readable.
  const merged = Object.fromEntries(Object.keys(source).map((key) => [key, overrides[key] ?? result[key]]));
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, `${lang.code}.json`), JSON.stringify(merged, null, 2) + "\n");
  console.log(`  wrote ${path.join(outDir, `${lang.code}.json`)}`);
}
