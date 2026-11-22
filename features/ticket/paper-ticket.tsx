"use client";

import React, { useRef, useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

interface PaperTicketProps {
  ticketCode: string;
  clientName: string;
  createdAt: number;
  totalFiles: number;
}

/* Side notches where the stub tears off, cut with a mask so the ticket keeps a real edge. */
const notchMask =
  "radial-gradient(circle 11px at 0 var(--tear), transparent 10.5px, #000 11px) left / 51% 100% no-repeat, radial-gradient(circle 11px at 100% var(--tear), transparent 10.5px, #000 11px) right / 51% 100% no-repeat";

export function PaperTicket({ ticketCode, clientName, createdAt, totalFiles }: PaperTicketProps) {
  const { t } = useI18n();
  const [copyState, setCopyState] = useState<"copied" | "error" | null>(null);
  const ticketRef = useRef<HTMLDivElement>(null);
  const [saveState, setSaveState] = useState<"saving" | "error" | null>(null);

  const handleSave = async () => {
    if (!ticketRef.current) return;
    setSaveState("saving");
    try {
      const dataUrl = await toPng(ticketRef.current, {
        pixelRatio: 3,
        // The copy button is for the screen, not the saved ticket.
        filter: (node) => !(node instanceof HTMLElement && node.dataset.captureSkip !== undefined),
      });
      const fileName = `${ticketCode}.png`;
      // On phones the share sheet can put it in Photos; a download would land in Files.
      if (window.matchMedia("(pointer: coarse)").matches && navigator.canShare) {
        const file = new File([await (await fetch(dataUrl)).blob()], fileName, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: ticketCode }).catch(() => {});
          setSaveState(null);
          return;
        }
      }
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = fileName;
      link.click();
      setSaveState(null);
    } catch (error) {
      console.error("Failed to save ticket image:", error);
      setSaveState("error");
      setTimeout(() => setSaveState(null), 3000);
    }
  };

  const copyWithFallback = () => {
    const input = document.createElement("textarea");
    input.value = ticketCode;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    let succeeded = false;
    try {
      input.focus();
      input.select();
      input.setSelectionRange(0, input.value.length);
      succeeded = document.execCommand("copy");
    } finally {
      input.remove();
    }
    if (!succeeded) throw new Error("Clipboard copy is unavailable");
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(ticketCode);
        } catch {
          copyWithFallback();
        }
      } else {
        copyWithFallback();
      }
      setCopyState("copied");
    } catch (error) {
      console.error("Failed to copy ticket code:", error);
      setCopyState("error");
    }
    setTimeout(() => setCopyState(null), 2000);
  };

  const created = new Date(createdAt);
  const formattedTime = created.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const formattedDate = created.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  const copyLabel = copyState === "copied" ? t("copied") : copyState === "error" ? t("copy_failed") : t("copy_code");

  return (
    <div>
      <div className="drop-shadow-[0_18px_28px_oklch(0_0_0/0.12)] dark:drop-shadow-none">
        <div
          ref={ticketRef}
          className="rounded-2xl bg-card"
          style={{ ["--tear" as string]: "68%", mask: notchMask, WebkitMask: notchMask }}
        >
          <div className="px-6 pt-6 pb-7 text-center sm:px-8 sm:pt-7">
            <p className="text-[13px] font-medium text-muted-foreground">{t("claim_code")}</p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <h1 className="font-mono text-[2.6rem] leading-none font-bold tracking-[-0.03em] text-foreground sm:text-[3.25rem]">
                <span className="marker">{ticketCode}</span>
              </h1>
              <button
                type="button"
                data-capture-skip
                onClick={handleCopy}
                aria-label={copyLabel}
                title={copyLabel}
                className={`inline-flex size-11 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  copyState === "copied"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {copyState === "copied" ? <Check className="size-[18px]" aria-hidden="true" /> : <Copy className="size-[18px]" aria-hidden="true" />}
              </button>
            </div>
            <p className="mt-4 text-[15px] text-muted-foreground">
              <span className="font-semibold text-foreground">{clientName}</span>
              <span aria-hidden="true"> · </span>
              {totalFiles} {totalFiles === 1 ? t("document") : t("documents")}
            </p>
          </div>

          <div className="mx-5 border-t-2 border-dashed border-border" aria-hidden="true" />

          <div className="flex items-center justify-between gap-4 px-6 py-4 text-[13px] sm:px-8">
            <span className="text-muted-foreground">{t("show_at_counter")}</span>
            <time className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums" dateTime={created.toISOString()}>
              {formattedDate} · {formattedTime}
            </time>
          </div>
        </div>
      </div>
      <div className="mt-3 flex justify-center">
        <Button variant="ghost" className="h-11 text-muted-foreground" onClick={handleSave} disabled={saveState === "saving"}>
          <Download data-icon="inline-start" aria-hidden="true" />
          {saveState === "error" ? t("save_image_failed") : t("save_image")}
        </Button>
      </div>
      <span className="sr-only" aria-live="polite">
        {copyState === "copied" ? t("copied") : copyState === "error" ? t("copy_failed") : saveState === "error" ? t("save_image_failed") : ""}
      </span>
    </div>
  );
}
