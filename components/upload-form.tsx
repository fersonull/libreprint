"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  File,
  X,
  Minus,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { ConfirmDialog } from "./confirm-dialog";

export type PaperSize = "Short (Letter)" | "A4" | "Long (Legal)" | "A3";
export type Orientation = "portrait" | "landscape";

interface UploadFileItem {
  id: string;
  file: File;
  copies: number;
  colorMode: "bw" | "color";
  paperSize: PaperSize;
  orientation: Orientation;
  doubleSided: boolean;
  notes: string;
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

export function UploadForm() {
  const router = useRouter();
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [clientName, setClientName] = useState("");
  const [fileList, setFileList] = useState<UploadFileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Alert confirmation dialog for clearing files
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const handleFiles = (incomingFiles: FileList | null) => {
    if (!incomingFiles || incomingFiles.length === 0) return;
    setErrorMessage(null);

    const allowed = [".pdf", ".docx", ".doc", ".png", ".jpg", ".jpeg"];
    const validItems: UploadFileItem[] = [];
    const rejected: string[] = [];

    Array.from(incomingFiles).forEach((file) => {
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      if (allowed.includes(ext)) {
        if (!fileList.some((existing) => existing.file.name === file.name && existing.file.size === file.size)) {
          validItems.push({
            id: `${file.name}-${Date.now()}-${Math.random()}`,
            file,
            copies: 1,
            colorMode: "bw",
            paperSize: "A4",
            orientation: "portrait",
            doubleSided: false,
            notes: "",
          });
        }
      } else {
        rejected.push(file.name);
      }
    });

    if (rejected.length > 0) {
      setErrorMessage(`Unsupported format: ${rejected.join(", ")}. Please upload PDF, Word (DOCX), or PNG/JPG.`);
    }

    if (validItems.length > 0) {
      setFileList((prev) => [...prev, ...validItems]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const updateItem = (id: string, updates: Partial<UploadFileItem>) => {
    setFileList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const removeFile = (id: string) => {
    setFileList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!clientName.trim()) {
      setErrorMessage(t("name_hint"));
      return;
    }

    if (fileList.length === 0) {
      setErrorMessage(t("select_docs"));
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("clientName", clientName.trim());

      const optionsMap: Record<
        string,
        {
          copies: number;
          colorMode: "bw" | "color";
          paperSize: PaperSize;
          orientation: Orientation;
          doubleSided: boolean;
          notes: string;
        }
      > = {};

      fileList.forEach((item) => {
        formData.append("files", item.file);
        optionsMap[item.file.name] = {
          copies: item.copies,
          colorMode: item.colorMode,
          paperSize: item.paperSize,
          orientation: item.orientation,
          doubleSided: item.doubleSided,
          notes: item.notes,
        };
      });

      formData.append("fileOptions", JSON.stringify(optionsMap));

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed.");
      }

      router.push(`/ticket/${data.ticketCode || data.ticketId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(message);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1 leading-relaxed">{errorMessage}</div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Client Name Input */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <label
          htmlFor="clientName"
          className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-1"
        >
          {t("full_name")}
        </label>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2.5">
          {t("name_hint")}
        </p>
        <input
          id="clientName"
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder={t("name_placeholder")}
          required
          autoComplete="name"
          className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-base text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all"
        />
      </div>

      {/* Drag & Drop File Zone */}
      <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
            {t("select_docs")}
          </label>
          <span className="text-[11px] text-zinc-400">PDF, DOCX, PNG, JPG</span>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
            isDragging
              ? "border-zinc-900 dark:border-zinc-100 bg-zinc-100 dark:bg-zinc-800/60"
              : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50/50 dark:bg-zinc-950/40"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>

          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {t("drag_drop_title")}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {t("drag_drop_subtitle")}
          </p>
        </div>

        {/* Selected Documents List with granular spec sizing */}
        {fileList.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
              <span>
                {fileList.length} {fileList.length === 1 ? "document" : "documents"}
              </span>
              <button
                type="button"
                onClick={() => setConfirmClearOpen(true)}
                className="text-zinc-500 hover:text-rose-600 transition-colors cursor-pointer"
              >
                {t("clear_all")}
              </button>
            </div>

            <div className="space-y-4">
              {fileList.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 space-y-3"
                >
                  {/* File Header Row */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {getFileIcon(item.file.name)}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm truncate">
                          {item.file.name}
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {formatFileSize(item.file.size)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFile(item.id)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Print Specifications Grid with Clear Labels */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-zinc-200/80 dark:border-zinc-800 text-xs">
                    {/* 1. Paper Size Spec */}
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        {t("paper_size")}
                      </label>
                      <select
                        value={item.paperSize}
                        onChange={(e) =>
                          updateItem(item.id, {
                            paperSize: e.target.value as PaperSize,
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
                      >
                        <option value="Short (Letter)">Short (Letter 8.5&quot; x 11&quot;)</option>
                        <option value="A4">A4 (8.27&quot; x 11.69&quot;)</option>
                        <option value="Long (Legal)">Long (Legal 8.5&quot; x 14&quot;)</option>
                        <option value="A3">A3 (11.7&quot; x 16.5&quot;)</option>
                      </select>
                    </div>

                    {/* 2. Color Mode */}
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        {t("color_mode")}
                      </label>
                      <div className="inline-flex w-full rounded-lg border border-zinc-300 dark:border-zinc-700 p-0.5 bg-zinc-100 dark:bg-zinc-800">
                        <button
                          type="button"
                          onClick={() => updateItem(item.id, { colorMode: "bw" })}
                          className={`flex-1 py-1 rounded-md text-[11px] font-medium transition-all ${
                            item.colorMode === "bw"
                              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                          }`}
                        >
                          {t("bw")}
                        </button>
                        <button
                          type="button"
                          onClick={() => updateItem(item.id, { colorMode: "color" })}
                          className={`flex-1 py-1 rounded-md text-[11px] font-medium transition-all ${
                            item.colorMode === "color"
                              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                          }`}
                        >
                          {t("color")}
                        </button>
                      </div>
                    </div>

                    {/* 3. Orientation & Sidedness */}
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        {t("duplex")}
                      </label>
                      <div className="inline-flex w-full rounded-lg border border-zinc-300 dark:border-zinc-700 p-0.5 bg-zinc-100 dark:bg-zinc-800">
                        <button
                          type="button"
                          onClick={() => updateItem(item.id, { doubleSided: false })}
                          className={`flex-1 py-1 rounded-md text-[11px] font-medium transition-all ${
                            !item.doubleSided
                              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                          }`}
                        >
                          1-Sided
                        </button>
                        <button
                          type="button"
                          onClick={() => updateItem(item.id, { doubleSided: true })}
                          className={`flex-1 py-1 rounded-md text-[11px] font-medium transition-all ${
                            item.doubleSided
                              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                          }`}
                        >
                          Back-to-Back
                        </button>
                      </div>
                    </div>

                    {/* 4. Copies Counter */}
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        {t("copies")}
                      </label>
                      <div className="flex items-center border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900">
                        <button
                          type="button"
                          onClick={() =>
                            updateItem(item.id, {
                              copies: Math.max(1, item.copies - 1),
                            })
                          }
                          disabled={item.copies <= 1}
                          className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="flex-1 text-center font-mono font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                          {item.copies}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateItem(item.id, {
                              copies: Math.min(50, item.copies + 1),
                            })
                          }
                          disabled={item.copies >= 50}
                          className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Special Notes / Instructions Field */}
                  <div className="pt-2">
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      {t("notes_label")}
                    </label>
                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) => updateItem(item.id, { notes: e.target.value })}
                      placeholder={t("notes_placeholder")}
                      maxLength={120}
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Alert Dialog for Clearing Selected Files */}
      <ConfirmDialog
        isOpen={confirmClearOpen}
        title="Alisin ang Lahat ng Dokumento?"
        message="Mawawala ang lahat ng inilagay mong mga dokumento sa listahan. Nais mo bang magpatuloy?"
        confirmLabel="Oo, Alisin Lahat"
        cancelLabel="Bumalik"
        onConfirm={() => {
          setFileList([]);
          setConfirmClearOpen(false);
        }}
        onCancel={() => setConfirmClearOpen(false)}
      />

      {/* Submit Action Button */}
      <button
        type="submit"
        disabled={isSubmitting || fileList.length === 0}
        className="w-full py-3 px-4 rounded-xl bg-zinc-900 hover:bg-black active:bg-zinc-950 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-white font-medium text-sm shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{t("submitting")}</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {t("submit_ticket")} ({fileList.length} {fileList.length === 1 ? "File" : "Files"})
            </span>
          </>
        )}
      </button>
    </form>
  );
}
