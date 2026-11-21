"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Ticket, PrintFile } from "@/lib/db";
import { DocumentPreview } from "./document-preview";
import { useI18n } from "@/lib/i18n";
import {
  ArrowLeft,
  Clock,
  Printer,
  CheckCircle2,
  Layers,
  Sparkles,
} from "lucide-react";

interface StaffTicketDetailProps {
  initialTicket: Ticket;
  initialFiles: PrintFile[];
}

export function StaffTicketDetail({
  initialTicket,
  initialFiles,
}: StaffTicketDetailProps) {
  const { t } = useI18n();
  const [ticket] = useState<Ticket>(initialTicket);
  const [files, setFiles] = useState<PrintFile[]>(initialFiles);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const handleStatusChange = async (
    fileId: string,
    newStatus: "queued" | "printing" | "done" | "cancelled"
  ) => {
    const res = await fetch(`/api/staff/files/${fileId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      const data = await res.json();
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? data.file : f))
      );
    } else {
      throw new Error("Failed to update file status");
    }
  };

  const markAllDone = async () => {
    setIsBulkUpdating(true);
    try {
      for (const file of files) {
        if (file.status !== "done") {
          await handleStatusChange(file.id, "done");
        }
      }
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const printAll = () => {
    files.forEach((file) => {
      window.open(`/api/files/${file.id}`, "_blank");
    });
  };

  const fileCount = files.length;
  const totalCopies = files.reduce((acc, f) => acc + (f.copies || 1), 0);
  const doneCount = files.filter((f) => f.status === "done").length;
  const allDone = fileCount > 0 && doneCount === fileCount;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/staff/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Print Queue</span>
        </Link>
      </div>

      {/* Ticket Header Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <span className="font-mono font-bold text-2xl sm:text-3xl text-zinc-900 dark:text-zinc-100">
              {ticket.ticket_code}
            </span>
            <span className="text-xs text-zinc-400 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(ticket.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {ticket.client_name}
          </h1>

          <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              {fileCount} {fileCount === 1 ? "document" : "documents"}
            </span>
            <span>•</span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {totalCopies} total {totalCopies === 1 ? "copy" : "copies"}
            </span>
            <span>•</span>
            <span className="tabular-nums">
              {doneCount} of {fileCount} printed
            </span>
          </div>
        </div>

        {/* Global Batch Actions */}
        <div className="flex items-center gap-2 flex-wrap pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={printAll}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-semibold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{t("open_all")}</span>
          </button>

          {!allDone && (
            <button
              type="button"
              disabled={isBulkUpdating}
              onClick={markAllDone}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{t("mark_all_done")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Individual Documents Previews & Controls */}
      <div className="space-y-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 flex items-center justify-between">
          <span>Documents to Print ({files.length})</span>
          {allDone && (
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              {t("completed_tab")}
            </span>
          )}
        </h2>

        {files.map((file) => (
          <DocumentPreview
            key={file.id}
            file={file}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>
    </div>
  );
}
