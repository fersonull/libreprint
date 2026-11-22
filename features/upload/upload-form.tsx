"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, AlertCircle, Ticket as TicketIcon } from "lucide-react";
import { useI18n } from "@/shared/lib/i18n";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { PrinterScene } from "@/shared/components/illustrations";
import { cn } from "@/shared/lib/utils";
import { Alert, AlertAction, AlertDescription } from "@/shared/components/ui/alert";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/shared/components/ui/field";
import { Input } from "@/shared/components/ui/input";
import { Separator } from "@/shared/components/ui/separator";
import { Spinner } from "@/shared/components/ui/spinner";
import { FileList } from "./file-list";
import { FileName } from "@/shared/components/file-glyph";
import { PrintSettings } from "./print-settings";
import { SheetPreview } from "./sheet-preview";
import { MAX_FILE_SIZE_BYTES, MAX_TOTAL_UPLOAD_BYTES } from "./limits";

export type PaperSize = "Short (Letter)" | "A4" | "Long (Legal)" | "A3";
export type Orientation = "portrait" | "landscape";

export interface UploadFileItem {
  id: string;
  file: File;
  copies: number;
  pages: string;
  colorMode: "bw" | "color";
  paperSize: PaperSize;
  orientation: Orientation;
  doubleSided: boolean;
  notes: string;
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
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleFiles = (incomingFiles: FileList | null) => {
    if (!incomingFiles || incomingFiles.length === 0) return;
    setErrorMessage(null);

    const allowed = [".pdf", ".docx", ".doc", ".png", ".jpg", ".jpeg"];
    const validItems: UploadFileItem[] = [];
    const rejected: string[] = [];
    const errors: string[] = [];
    let totalSize = fileList.reduce((total, item) => total + item.file.size, 0);

    Array.from(incomingFiles).forEach((file) => {
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      if (!allowed.includes(ext)) {
        rejected.push(file.name);
        return;
      }

      if (fileList.some((existing) => existing.file.name === file.name && existing.file.size === file.size)) return;
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(t("file_size_limit"));
        return;
      }
      if (totalSize + file.size > MAX_TOTAL_UPLOAD_BYTES) {
        errors.push(t("total_upload_limit"));
        return;
      }

      validItems.push({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        copies: 1,
        pages: "All",
        colorMode: "bw",
        paperSize: "A4",
        orientation: "portrait",
        doubleSided: false,
        notes: "",
      });
      totalSize += file.size;
    });

    if (rejected.length > 0) {
      errors.push(t("unsupported_files").replace("{files}", rejected.join(", ")));
    }
    if (errors.length > 0) setErrorMessage([...new Set(errors)].join(" "));

    if (validItems.length > 0) {
      setFileList((prev) => [...prev, ...validItems]);
      setSelectedId(validItems[0].id);
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

      const fileOptions: {
          copies: number;
          pages: string;
          colorMode: "bw" | "color";
          paperSize: PaperSize;
          orientation: Orientation;
          doubleSided: boolean;
          notes: string;
        }[] = [];

      fileList.forEach((item) => {
        formData.append("files", item.file);
        fileOptions.push({
          copies: item.copies,
          pages: item.pages,
          colorMode: item.colorMode,
          paperSize: item.paperSize,
          orientation: item.orientation,
          doubleSided: item.doubleSided,
          notes: item.notes,
        });
      });

      formData.append("fileOptions", JSON.stringify(fileOptions));

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t("upload_failed"));
      }

      router.push(`/ticket/${data.ticketCode || data.ticketId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("unexpected_error");
      setErrorMessage(message);
      setIsSubmitting(false);
    }
  };

  const selected = fileList.find((item) => item.id === selectedId) ?? fileList[0] ?? null;

  // Copies the chosen document's print choices (not its notes) onto every file.
  const applyToAll = () => {
    if (!selected) return;
    const { copies, pages, colorMode, paperSize, orientation, doubleSided } = selected;
    setFileList((prev) =>
      prev.map((item) => ({ ...item, copies, pages, colorMode, paperSize, orientation, doubleSided }))
    );
  };

  const handleRemove = (id: string) => {
    if (id === selected?.id) {
      const index = fileList.findIndex((item) => item.id === id);
      const next = fileList[index + 1] ?? fileList[index - 1] ?? null;
      setSelectedId(next?.id ?? null);
    }
    removeFile(id);
  };

  const fileCountLabel = `${fileList.length} ${fileList.length === 1 ? t("files_one") : t("files_other")}`;

  const preview = (item: UploadFileItem | null) => (
    <SheetPreview
      paperSize={item?.paperSize ?? "A4"}
      orientation={item?.orientation ?? "portrait"}
      colorMode={item?.colorMode ?? "bw"}
      doubleSided={item?.doubleSided ?? false}
      copies={item?.copies ?? 1}
      label={t("preview_label")}
      empty={!item}
    />
  );

  const submitButton = (className?: string) => (
    <Button
      type="submit"
      size="lg"
      disabled={isSubmitting || fileList.length === 0}
      className={cn("h-11", className)}
    >
      {isSubmitting ? (
        <>
          <Spinner data-icon="inline-start" />
          {t("submitting")}
        </>
      ) : (
        <>
          <TicketIcon data-icon="inline-start" aria-hidden="true" />
          {t("submit_ticket")}
          {fileList.length > 0 && <span className="font-normal opacity-70">· {fileCountLabel}</span>}
        </>
      )}
    </Button>
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="grid items-start gap-4 pb-28 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-6 lg:pb-0"
    >
      {/* Left: who is printing, and what */}
      <Card className="gap-0 py-0">
        {errorMessage && (
          <Alert variant="destructive" className="rounded-none border-0 border-b px-5 py-4 sm:px-6">
            <AlertCircle aria-hidden="true" />
            <AlertDescription>{errorMessage}</AlertDescription>
            <AlertAction>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setErrorMessage(null)}
                aria-label={t("dismiss")}
              >
                <X />
              </Button>
            </AlertAction>
          </Alert>
        )}

        <div className="px-5 py-6 sm:px-6">
          <Field>
            <FieldLabel htmlFor="clientName">{t("full_name")}</FieldLabel>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder={t("name_placeholder")}
              required
              autoComplete="name"
              aria-describedby="clientName-hint"
              className="h-11 sm:h-10"
            />
            <FieldDescription id="clientName-hint">{t("name_hint")}</FieldDescription>
          </Field>
        </div>

        <Separator />

        <section className="flex flex-col gap-4 px-5 py-6 sm:px-6" aria-labelledby="docs-heading">
          <div className="flex min-h-8 items-center justify-between gap-3">
            <h2 id="docs-heading" className="flex items-center gap-2 font-medium text-foreground">
              {t("your_documents")}
              {fileList.length > 0 && (
                <Badge variant="secondary" className="font-mono tabular-nums">
                  {fileList.length}
                </Badge>
              )}
            </h2>
            {fileList.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirmClearOpen(true)}
                className="-mr-2 h-11 text-muted-foreground lg:hidden"
              >
                {t("clear_all")}
              </Button>
            )}
          </div>

          <label
            htmlFor="upload-files"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-center transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
              fileList.length > 0 ? "px-4 py-5" : "px-6 pt-6 pb-8",
              isDragging ? "border-foreground bg-muted" : "border-input hover:bg-muted/50"
            )}
          >
            <input
              ref={fileInputRef}
              id="upload-files"
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
              onChange={(e) => {
                handleFiles(e.target.files);
                e.currentTarget.value = "";
              }}
              className="sr-only"
            />
            <PrinterScene
              active={isDragging}
              className={cn("w-auto shrink-0", fileList.length > 0 ? "mb-1 h-16" : "mb-3 h-28 sm:h-32")}
            />
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
              {fileList.length > 0 && <Plus className="size-4" aria-hidden="true" />}
              {t("drag_drop_title")}
            </span>
            <span className="text-xs text-pretty text-muted-foreground">{t("drag_drop_subtitle")}</span>
          </label>

          {fileList.length > 0 && (
            <FileList
              items={fileList}
              selectedId={selected?.id ?? null}
              onSelect={setSelectedId}
              onRemove={handleRemove}
              renderSelected={(item) => (
                <div className="flex flex-col gap-5">
                  <div className="rounded-md bg-muted/50 px-3 pt-3 pb-2">{preview(item)}</div>
                  <PrintSettings
                    key={item.id}
                    item={item}
                    idPrefix="m"
                    fileCount={fileList.length}
                    onChange={(updates) => updateItem(item.id, updates)}
                    onApplyToAll={applyToAll}
                  />
                </div>
              )}
            />
          )}
        </section>
      </Card>

      {/* Right: settings for the chosen document (desktop only) */}
      <Card className="sticky top-20 hidden max-h-[calc(100dvh-6rem)] gap-0 py-0 lg:flex">
        <CardHeader className="border-b py-4 [.border-b]:pb-4">
          <CardTitle>{t("print_settings")}</CardTitle>
          <CardDescription className="min-w-0">
            {selected ? <FileName name={selected.file.name} /> : t("settings_empty")}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto py-5">
          <div className="rounded-md bg-muted/50 px-4 pt-4 pb-3">{preview(selected)}</div>
          {selected && (
            <PrintSettings
              key={selected.id}
              item={selected}
              idPrefix="d"
              fileCount={fileList.length}
              onChange={(updates) => updateItem(selected.id, updates)}
              onApplyToAll={applyToAll}
            />
          )}
        </CardContent>

        <CardFooter className="gap-2 border-t py-4">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => setConfirmClearOpen(true)}
            disabled={fileList.length === 0 || isSubmitting}
            className="h-11"
          >
            {t("clear_all")}
          </Button>
          {submitButton("flex-1")}
        </CardFooter>
      </Card>

      {/* Phones and tablets: keep the main action in reach */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
        <div className="mx-auto max-w-2xl">{submitButton("w-full")}</div>
      </div>

      <ConfirmDialog
        isOpen={confirmClearOpen}
        title={t("clear_all_title")}
        message={t("clear_all_msg")}
        confirmLabel={t("clear_all_confirm")}
        cancelLabel={t("clear_all_cancel")}
        onConfirm={() => {
          setFileList([]);
          setSelectedId(null);
          setConfirmClearOpen(false);
        }}
        onCancel={() => setConfirmClearOpen(false)}
      />
    </form>
  );
}
