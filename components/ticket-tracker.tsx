"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { StatusBadge, PrintStatus } from "./status-badge";
import { Ticket, PrintFile } from "@/lib/db";
import { PaperTicket } from "./paper-ticket";
import { useI18n } from "@/lib/i18n";
import { RefreshCw, Printer, StickyNote } from "lucide-react";
import { StatusPlates, type PlateStage } from "./illustrations";
import { FileGlyph } from "./file-glyph";

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
  return <FileGlyph fileName={fileName} />;
}

export function TicketTracker({ initialTicket, initialFiles }: TicketTrackerProps) {
  const { t } = useI18n();
  const [ticket] = useState<Ticket>(initialTicket);
  const [files, setFiles] = useState<PrintFile[]>(initialFiles);
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

  const stage: PlateStage = allDone ? "done" : printingFiles > 0 || doneFiles > 0 ? "printing" : "queued";
  const headline = allDone ? t("all_ready") : printingFiles > 0 ? t("currently_printing") : t("queued_status");

  return (
    <div className="space-y-5">
      <PaperTicket
        ticketCode={ticket.ticket_code}
        clientName={ticket.client_name}
        createdAt={ticket.created_at}
        totalFiles={totalFiles}
      />

      {/* Live status */}
      <section
        aria-labelledby="live-status"
        className="rounded-2xl bg-card px-5 pt-5 pb-6 shadow-card sm:px-7"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2
              id="live-status"
              aria-live="polite"
              className={`text-[15px] font-semibold ${allDone ? "text-emerald-700 dark:text-emerald-400" : "text-foreground"}`}
            >
              {headline}
            </h2>
            <p className="mt-0.5 font-mono text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
              {doneFiles} / {totalFiles} · {t("progress")}
            </p>
          </div>
          <button
            type="button"
            onClick={refreshData}
            disabled={isRefreshing}
            aria-label="Refresh"
            title="Refresh"
            className="-mr-2 -mt-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden="true" />
          </button>
        </div>

        <StatusPlates
          stage={stage}
          labels={{ queued: t("stage_queued"), printing: t("stage_printing"), done: t("stage_done") }}
        />
      </section>

      {/* Documents */}
      <section
        aria-labelledby="docs-heading"
        className="rounded-2xl bg-card shadow-card"
      >
        <h2 id="docs-heading" className="px-5 pt-5 pb-2 text-[15px] font-semibold text-foreground sm:px-7">
          {t("documents_heading")} <span className="font-mono text-xs font-normal text-zinc-400">({totalFiles})</span>
        </h2>

        <ul className="divide-y divide-border">
          {files.map((file) => (
            <li key={file.id} className="flex items-start gap-3 px-5 py-4 sm:items-center sm:px-7">
              {getFileIcon(file.file_name)}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{file.file_name}</p>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  {[
                    file.paper_size || "A4",
                    file.orientation === "landscape" ? t("landscape") : t("portrait"),
                    file.copies === 1 ? t("copy_one") : t("copies_count").replace("{n}", String(file.copies)),
                    file.color_mode === "color" ? t("color") : t("bw"),
                    file.double_sided ? t("double_sided") : t("single_sided"),
                  ].join(" · ")}
                  <span className="font-mono text-xs"> · {formatFileSize(file.file_size)}</span>
                </p>
                {file.notes && (
                  <p className="mt-1.5 inline-flex items-start gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                    <StickyNote className="mt-px h-3 w-3 shrink-0" aria-hidden="true" />
                    <span>{file.notes}</span>
                  </p>
                )}
              </div>
              <StatusBadge status={file.status as PrintStatus} size="md" className="shrink-0" />
            </li>
          ))}
        </ul>
      </section>

      <p className="flex items-start gap-2.5 px-1 text-[13px] leading-relaxed text-muted-foreground">
        <Printer className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
        <span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">{t("how_to_collect_title")}. </span>
          {t("how_to_collect_body")}
        </span>
      </p>
    </div>
  );
}
