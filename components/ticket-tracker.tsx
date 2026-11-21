"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { StatusBadge, PrintStatus } from "./status-badge";
import { Ticket, PrintFile } from "@/lib/db";
import { PaperTicket } from "./paper-ticket";
import { useI18n } from "@/lib/i18n";
import {
  FileText,
  Image as ImageIcon,
  File,
  CheckCircle,
  RefreshCw,
  Printer,
  Wifi,
  WifiOff,
  StickyNote,
} from "lucide-react";

interface TicketTrackerProps {
  initialTicket: Ticket;
  initialFiles: PrintFile[];
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(fileName: string) {
  const ext = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
  if (ext === ".pdf") {
    return <FileText className="w-5 h-5 text-zinc-900 dark:text-zinc-100 shrink-0" />;
  }
  if ([".png", ".jpg", ".jpeg"].includes(ext)) {
    return <ImageIcon className="w-5 h-5 text-zinc-900 dark:text-zinc-100 shrink-0" />;
  }
  return <File className="w-5 h-5 text-zinc-700 dark:text-zinc-300 shrink-0" />;
}

export function TicketTracker({ initialTicket, initialFiles }: TicketTrackerProps) {
  const { t } = useI18n();
  const [ticket] = useState<Ticket>(initialTicket);
  const [files, setFiles] = useState<PrintFile[]>(initialFiles);
  const [isConnected, setIsConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const refreshData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch(`/api/tickets/${ticket.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.files) {
          setFiles(data.files);
        }
      }
    } catch (err) {
      console.error("Failed to re-fetch ticket:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [ticket.id]);

  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout;

    const connectSSE = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const es = new EventSource(`/api/tickets/${ticket.id}/stream`);
      eventSourceRef.current = es;

      es.onopen = () => {
        setIsConnected(true);
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "status-update") {
            setFiles((prevFiles) =>
              prevFiles.map((f) =>
                f.id === data.fileId
                  ? {
                      ...f,
                      status: data.status,
                      printed_at: data.printedAt ?? f.printed_at,
                    }
                  : f
              )
            );
          }
        } catch (err) {
          console.error("SSE parse error:", err);
        }
      };

      es.onerror = () => {
        setIsConnected(false);
        es.close();
        reconnectTimeout = setTimeout(connectSSE, 3000);
      };
    };

    connectSSE();

    const pollInterval = setInterval(() => {
      refreshData();
    }, 6000);

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      clearTimeout(reconnectTimeout);
      clearInterval(pollInterval);
    };
  }, [ticket.id, refreshData]);

  const totalFiles = files.length;
  const doneFiles = files.filter((f) => f.status === "done").length;
  const printingFiles = files.filter((f) => f.status === "printing").length;
  const allDone = totalFiles > 0 && doneFiles === totalFiles;
  const percentComplete = totalFiles > 0 ? Math.round((doneFiles / totalFiles) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* 1. Official SVG Paper Ticket with Code Inside */}
      <PaperTicket
        ticketCode={ticket.ticket_code}
        clientName={ticket.client_name}
        createdAt={ticket.created_at}
        totalFiles={totalFiles}
      />

      {/* 2. Live Status & Progress Bar */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            {allDone ? (
              <span className="font-semibold text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                {t("all_ready")}
              </span>
            ) : printingFiles > 0 ? (
              <span className="font-semibold text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <Printer className="w-4 h-4 animate-pulse-subtle" />
                {t("currently_printing")}
              </span>
            ) : (
              <span className="font-semibold text-xs text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse-subtle" />
                {t("queued_status")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                isConnected
                  ? "border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                  : "border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
              }`}
            >
              {isConnected ? (
                <>
                  <Wifi className="w-2.5 h-2.5" />
                  <span>{t("live_connected")}</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-2.5 h-2.5" />
                  <span>{t("reconnecting")}</span>
                </>
              )}
            </span>

            <button
              type="button"
              onClick={refreshData}
              disabled={isRefreshing}
              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 rounded"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Progress track */}
        <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full transition-all duration-500 ${
              allDone ? "bg-emerald-600 dark:bg-emerald-500" : "bg-zinc-900 dark:bg-zinc-100"
            }`}
            style={{ width: `${percentComplete}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-500">
          <span>{t("progress")}</span>
          <span className="font-mono tabular-nums font-semibold">
            {doneFiles} / {totalFiles} ({percentComplete}%)
          </span>
        </div>
      </div>

      {/* 3. Document Items List with Specifications */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-xs">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
          Documents ({totalFiles})
        </h2>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950">
          {files.map((file) => (
            <div
              key={file.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="mt-0.5">{getFileIcon(file.file_name)}</div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100 text-sm truncate">
                    {file.file_name}
                  </p>

                  {/* Document specs pills */}
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500 flex-wrap">
                    <span className="font-mono">{formatFileSize(file.file_size)}</span>
                    <span>•</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {file.paper_size || "A4"}
                    </span>
                    <span>•</span>
                    <span className="tabular-nums">
                      {file.copies} {file.copies === 1 ? "copy" : "copies"}
                    </span>
                    <span>•</span>
                    <span className="font-medium">
                      {file.color_mode === "color" ? "Color" : "B&W"}
                    </span>
                    <span>•</span>
                    <span>{file.double_sided ? "Back-to-Back" : "1-Sided"}</span>
                  </div>

                  {/* Notes if any */}
                  {file.notes && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 mt-1">
                      <StickyNote className="w-3 h-3 text-zinc-400 shrink-0" />
                      <span>{file.notes}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="shrink-0 pt-2 sm:pt-0">
                <StatusBadge status={file.status as PrintStatus} size="md" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pickup instructions */}
      <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-700 dark:text-zinc-300 flex items-start gap-3">
        <Printer className="w-4 h-4 text-zinc-600 dark:text-zinc-300 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
            {t("how_to_collect_title")}
          </p>
          <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {t("how_to_collect_body")}
          </p>
        </div>
      </div>
    </div>
  );
}
