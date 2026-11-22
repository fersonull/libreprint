"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { FileGlyph } from "@/components/file-glyph";
import type { UploadFileItem } from "@/components/upload-form";
import { PAPER_SPECS } from "./sheet-preview";

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/** Splits a name so the stem can truncate while the extension stays visible. */
function splitName(name: string) {
  const dot = name.lastIndexOf(".");
  if (dot <= 0) return { stem: name, ext: "" };
  return { stem: name.slice(0, dot), ext: name.slice(dot) };
}

export function FileName({ name, className }: { name: string; className?: string }) {
  const { stem, ext } = splitName(name);
  return (
    <span className={cn("flex min-w-0", className)} title={name}>
      <span className="truncate">{stem}</span>
      <span className="shrink-0">{ext}</span>
    </span>
  );
}

export function useSettingsSummary() {
  const { t } = useI18n();
  return (item: UploadFileItem) =>
    [
      PAPER_SPECS[item.paperSize].short,
      item.orientation === "landscape" ? t("landscape") : t("portrait"),
      item.colorMode === "color" ? t("color") : t("bw"),
      item.copies === 1 ? t("copy_one") : t("copies_count").replace("{n}", String(item.copies)),
    ].join(" · ");
}

/**
 * Documents as selectable rows. The selected row lifts onto a white card the
 * way the reference's checked chip does; on small screens its settings open
 * underneath it via `renderSelected`.
 */
export function FileList({
  items,
  selectedId,
  onSelect,
  onRemove,
  renderSelected,
}: {
  items: UploadFileItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  renderSelected?: (item: UploadFileItem) => ReactNode;
}) {
  const { t } = useI18n();
  const summary = useSettingsSummary();

  return (
    <ul className="flex flex-col gap-2" aria-label={t("selected_docs")}>
      {items.map((item) => {
        const selected = item.id === selectedId;
        return (
          <li
            key={item.id}
            className={cn(
              "rounded-lg border transition-colors duration-200 animate-in fade-in slide-in-from-bottom-1",
              selected ? "border-foreground/25 bg-muted/50" : "border-border bg-card hover:bg-muted/40"
            )}
          >
            <div className="flex items-center gap-1 pr-1.5">
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                aria-pressed={selected}
                className="flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-lg py-2.5 pl-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <FileGlyph fileName={item.file.name} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <FileName name={item.file.name} className="text-sm font-medium text-foreground" />
                  <span className="truncate text-xs text-muted-foreground">
                    <span className="font-mono tabular-nums">{formatFileSize(item.file.size)}</span>
                    <span aria-hidden="true"> · </span>
                    {summary(item)}
                  </span>
                </span>
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onRemove(item.id)}
                aria-label={`${t("remove_file")}: ${item.file.name}`}
                title={t("remove_file")}
                className="size-11 shrink-0 text-muted-foreground hover:text-destructive sm:size-9"
              >
                <X />
              </Button>
            </div>
            {selected && renderSelected && (
              <div className="border-t border-border px-3 pt-4 pb-4 lg:hidden">{renderSelected(item)}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
