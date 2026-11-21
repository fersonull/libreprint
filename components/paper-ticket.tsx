"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface PaperTicketProps {
  ticketCode: string;
  clientName: string;
  createdAt: number;
  totalFiles: number;
}

export function PaperTicket({
  ticketCode,
  clientName,
  createdAt,
  totalFiles,
}: PaperTicketProps) {
  const { t } = useI18n();
  const [copyState, setCopyState] = useState<"copied" | "error" | null>(null);

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

  const formattedTime = new Date(createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const formattedDate = new Date(createdAt).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="w-full max-w-md mx-auto my-4 transition-transform duration-200 hover:-translate-y-0.5 select-none">
      <div className="relative filter drop-shadow-sm">
        {/* SVG Paper Ticket Backdrop with perforated notches & tear seam */}
        <svg
          viewBox="0 0 380 230"
          className="w-full h-auto"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main Paper Ticket Body with Side Cutout Notches */}
          <path
            d="
              M 16 0 
              H 364 
              A 16 16 0 0 1 380 16 
              V 102 
              A 14 14 0 0 0 380 130 
              V 214 
              A 16 16 0 0 1 364 230 
              H 16 
              A 16 16 0 0 1 0 214 
              V 130 
              A 14 14 0 0 0 0 102 
              V 16 
              A 16 16 0 0 1 16 0 
              Z
            "
            className="fill-zinc-50 dark:fill-zinc-900 stroke-zinc-300 dark:stroke-zinc-800"
            strokeWidth="1.5"
          />

          {/* Inner Decorative Framing Border */}
          <path
            d="
              M 20 8 
              H 360 
              A 8 8 0 0 1 368 16 
              V 98 
              A 18 18 0 0 0 368 134 
              V 214 
              A 8 8 0 0 1 360 222 
              H 20 
              A 8 8 0 0 1 12 214 
              V 134 
              A 18 18 0 0 0 12 98 
              V 16 
              A 8 8 0 0 1 20 8 
              Z
            "
            className="stroke-zinc-200/80 dark:stroke-zinc-800/80"
            strokeWidth="1"
            strokeDasharray="4 2"
          />

          {/* Horizontal Perforated Tear Line */}
          <line
            x1="18"
            y1="116"
            x2="362"
            y2="116"
            className="stroke-zinc-300 dark:stroke-zinc-700"
            strokeWidth="1.5"
            strokeDasharray="5 5"
          />

          {/* Top Ticket Header Details */}
          <text
            x="190"
            y="32"
            textAnchor="middle"
            className="fill-zinc-400 dark:fill-zinc-500 text-[10px] uppercase font-mono tracking-widest font-semibold"
          >
            LIBREPRINT • CLAIM STUB
          </text>

          <text
            x="190"
            y="98"
            textAnchor="middle"
            className="fill-zinc-500 dark:fill-zinc-400 text-[11px] font-sans font-medium"
          >
            {clientName} • {totalFiles} {totalFiles === 1 ? "document" : "documents"}
          </text>

          {/* Bottom Stub Details */}
          <text
            x="32"
            y="142"
            className="fill-zinc-400 dark:fill-zinc-500 text-[9px] uppercase font-mono tracking-wider"
          >
            DATE & TIME
          </text>
          <text
            x="32"
            y="158"
            className="fill-zinc-800 dark:fill-zinc-200 text-[12px] font-sans font-medium"
          >
            {formattedDate} • {formattedTime}
          </text>

          <text
            x="248"
            y="142"
            className="fill-zinc-400 dark:fill-zinc-500 text-[9px] uppercase font-mono tracking-wider"
          >
            SERVICE DESK
          </text>
          <text
            x="248"
            y="158"
            className="fill-zinc-800 dark:fill-zinc-200 text-[12px] font-mono font-medium"
          >
            STATION #1
          </text>

          {/* Simulated Barcode at Bottom */}
          <g className="fill-zinc-700 dark:fill-zinc-400">
            <rect x="32" y="180" width="3" height="26" />
            <rect x="38" y="180" width="1.5" height="26" />
            <rect x="42" y="180" width="4.5" height="26" />
            <rect x="50" y="180" width="2" height="26" />
            <rect x="55" y="180" width="3" height="26" />
            <rect x="62" y="180" width="1.5" height="26" />
            <rect x="67" y="180" width="6" height="26" />
            <rect x="76" y="180" width="2" height="26" />
            <rect x="82" y="180" width="3" height="26" />
            <rect x="88" y="180" width="1.5" height="26" />
            <rect x="92" y="180" width="5" height="26" />
            <rect x="100" y="180" width="2.5" height="26" />
            <rect x="106" y="180" width="4" height="26" />
            <rect x="114" y="180" width="2" height="26" />
            <rect x="119" y="180" width="6" height="26" />
            <rect x="128" y="180" width="3" height="26" />
            <rect x="134" y="180" width="1.5" height="26" />
            <rect x="139" y="180" width="4" height="26" />
            <rect x="146" y="180" width="2" height="26" />
            <rect x="151" y="180" width="5" height="26" />
            <rect x="160" y="180" width="2.5" height="26" />
            <rect x="166" y="180" width="3.5" height="26" />
            <rect x="173" y="180" width="1.5" height="26" />
            <rect x="178" y="180" width="4" height="26" />
            <rect x="185" y="180" width="2" height="26" />
            <rect x="190" y="180" width="6" height="26" />
            <rect x="200" y="180" width="2" height="26" />
            <rect x="205" y="180" width="3.5" height="26" />
            <rect x="212" y="180" width="2" height="26" />
            <rect x="217" y="180" width="5" height="26" />
            <rect x="225" y="180" width="2" height="26" />
            <rect x="230" y="180" width="4" height="26" />
            <rect x="237" y="180" width="1.5" height="26" />
            <rect x="242" y="180" width="6" height="26" />
            <rect x="252" y="180" width="2" height="26" />
            <rect x="257" y="180" width="3.5" height="26" />
            <rect x="264" y="180" width="2" height="26" />
            <rect x="269" y="180" width="4.5" height="26" />
            <rect x="277" y="180" width="1.5" height="26" />
            <rect x="282" y="180" width="6" height="26" />
            <rect x="292" y="180" width="2" height="26" />
            <rect x="297" y="180" width="3.5" height="26" />
            <rect x="304" y="180" width="2" height="26" />
            <rect x="309" y="180" width="5" height="26" />
            <rect x="317" y="180" width="2" height="26" />
            <rect x="322" y="180" width="4" height="26" />
            <rect x="329" y="180" width="1.5" height="26" />
            <rect x="334" y="180" width="6" height="26" />
            <rect x="344" y="180" width="3" height="26" />
          </g>

          <text
            x="190"
            y="218"
            textAnchor="middle"
            className="fill-zinc-400 dark:fill-zinc-500 text-[8px] font-mono tracking-widest"
          >
            * {ticketCode} *
          </text>
        </svg>

        {/* Ticket code and copy control share one centered line. */}
        <div className="absolute left-1/2 top-[19%] z-10 flex -translate-x-1/2 items-center gap-2">
          <span className="whitespace-nowrap font-mono text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-3xl">{ticketCode}</span>
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copyState === "copied" ? t("copied") : copyState === "error" ? t("copy_failed") : t("copy_code")}
            title={copyState === "copied" ? t("copied") : copyState === "error" ? t("copy_failed") : t("copy_code")}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {copyState === "copied" ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
          </button>
        </div>
        <span className="sr-only" aria-live="polite">{copyState === "copied" ? t("copied") : copyState === "error" ? t("copy_failed") : ""}</span>
      </div>
    </div>
  );
}
