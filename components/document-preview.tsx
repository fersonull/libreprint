"use client";

import React, { useState } from "react";
import { PrintFile } from "@/lib/db";
import { StatusBadge, PrintStatus } from "./status-badge";
import { ConfirmDialog } from "./confirm-dialog";
import { useI18n } from "@/lib/i18n";
import {
  Printer,
  CheckCircle2,
  PlayCircle,
  XCircle,
  ExternalLink,
  FileText,
  Loader2,
  AlertCircle,
  StickyNote,
  Info,
} from "lucide-react";

interface DocumentPreviewProps {
  file: PrintFile;
  onStatusChange: (
    fileId: string,
    newStatus: "queued" | "printing" | "done" | "cancelled",
  ) => Promise<void>;
}

export function DocumentPreview({
  file,
  onStatusChange,
}: DocumentPreviewProps) {
  const { t } = useI18n();
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  const fileUrl = `/api/files/${file.id}`;
  const isPdf =
    file.file_type === "application/pdf" ||
    file.file_name.toLowerCase().endsWith(".pdf");
  const isImage =
    file.file_type.startsWith("image/") ||
    [".png", ".jpg", ".jpeg"].some((ext) =>
      file.file_name.toLowerCase().endsWith(ext),
    );

  const handleAction = async (
    status: "queued" | "printing" | "done" | "cancelled",
  ) => {
    try {
      setIsUpdating(true);
      setErrorMsg(null);
      await onStatusChange(file.id, status);
    } catch (err) {
      setErrorMsg("Failed to update status");
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open(fileUrl, "_blank");
    if (printWindow) {
      printWindow.focus();
      if (file.status === "queued") {
        handleAction("printing");
      }
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
      {/* File Header */}
      <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-950/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base truncate max-w-md">
              {file.file_name}
            </h3>
            <StatusBadge status={file.status as PrintStatus} size="sm" />
          </div>

          {/* Granular document print specs with clear labels */}
          <div className="flex items-center gap-2.5 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 bg-zinc-200/60 dark:bg-zinc-800 px-2 py-0.5 rounded text-[11px]">
              {file.paper_size || "A4"}
            </span>
            <span>•</span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {file.copies} {file.copies === 1 ? "Copy" : "Copies"}
            </span>
            <span>•</span>
            <span>Pages: {file.pages || "All"}</span>
            <span>•</span>
            <span className="font-medium uppercase text-[11px]">
              {file.color_mode === "color" ? "Color" : "B&W"}
            </span>
            <span>•</span>
            <span>{file.double_sided ? "Back-to-Back" : "1-Sided"}</span>
            <span>•</span>
            <span className="capitalize">{file.orientation || "portrait"}</span>
          </div>

          {/* Customer notes / instructions callout */}
          {file.notes && (
            <div className="mt-2 text-sm  py-1.5 rounded-lg flex items-center gap-2">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>
                <strong>Note:</strong> {file.notes}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-black active:bg-zinc-950 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t("open_and_print")}</span>
          </button>

          {/* Status buttons */}
          {file.status !== "printing" && file.status !== "done" && (
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleAction("printing")}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              <PlayCircle className="w-3.5 h-3.5 text-blue-600" />
              <span>{t("mark_printing")}</span>
            </button>
          )}

          {file.status !== "done" && (
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleAction("done")}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 text-xs font-medium hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t("mark_done")}</span>
            </button>
          )}

          {/* Destructive Cancel Trigger with Alert */}
          {file.status !== "cancelled" && file.status !== "done" && (
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => setConfirmCancelOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
              title="Cancel document"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t("cancel_btn")}</span>
            </button>
          )}

          {isUpdating && (
            <Loader2 className="w-4 h-4 animate-spin text-zinc-500 ml-1" />
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Confirmation Dialog for Undoable Cancel Operation */}
      <ConfirmDialog
        isOpen={confirmCancelOpen}
        title={t("confirm_cancel_title")}
        message={t("confirm_cancel_msg")}
        confirmLabel={t("confirm_cancel_action")}
        cancelLabel={t("keep_btn")}
        onConfirm={async () => {
          setConfirmCancelOpen(false);
          await handleAction("cancelled");
        }}
        onCancel={() => setConfirmCancelOpen(false)}
      />

      {/* Embedded Document Preview Area */}
      <div className="bg-zinc-100 dark:bg-zinc-950 p-2 sm:p-4 flex items-center justify-center min-h-[350px]">
        {isPdf ? (
          <iframe
            src={`${fileUrl}#toolbar=1`}
            title={`Preview of ${file.file_name}`}
            className="w-full h-[520px] rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-inner"
          />
        ) : isImage ? (
          <div className="max-h-[520px] overflow-auto flex items-center justify-center p-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-300 dark:border-zinc-800 w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fileUrl}
              alt={file.file_name}
              className="max-h-[500px] object-contain rounded"
            />
          </div>
        ) : (
          <div className="text-center p-8 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-300 dark:border-zinc-800 max-w-md w-full">
            <FileText className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
            <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm mb-1">
              {file.file_name}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              Open document to print via browser print dialog.
            </p>
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold hover:bg-black transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{t("open_and_print")}</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
