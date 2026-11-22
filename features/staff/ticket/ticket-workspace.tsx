"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type Ref } from "react";
import { CheckCheck, ExternalLink, Printer, StickyNote, XCircle } from "lucide-react";
import type { PrintFile, Ticket } from "@/shared/server/db";
import { useI18n } from "@/shared/lib/i18n";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Spinner } from "@/shared/components/ui/spinner";
import { StatusBadge, type PrintStatus } from "@/shared/components/status-badge";
import { FileGlyph, FileName } from "@/shared/components/file-glyph";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { clockTime, plural, timeAgo } from "../format";

const fileUrl = (file: PrintFile) => `/api/files/${file.id}`;
/** 44px tall on phones, the default 36px from sm up. */
const TAP = "h-11 sm:h-9";
const noop = () => () => {};

/** Opens a tab and reports whether the browser allowed it. (noopener would make window.open always return null.) */
function openTab(url: string) {
  const win = window.open(url, "_blank");
  if (win) win.opener = null;
  return win !== null;
}

function specLine(file: PrintFile) {
  return [
    file.paper_size || "A4",
    plural(file.copies || 1, "copy", "copies"),
    file.color_mode === "color" ? "Color" : "B&W",
  ].join(" · ");
}

export function TicketWorkspace({ ticket, initialFiles }: { ticket: Ticket; initialFiles: PrintFile[] }) {
  const { t } = useI18n();
  const [files, setFiles] = useState(initialFiles);
  const [selectedId, setSelectedId] = useState(
    () => (initialFiles.find((f) => f.status === "queued" || f.status === "printing") ?? initialFiles[0])?.id
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Live: another staff member or tab can change this ticket. The stream sends each status change;
  // a full reload on (re)connect catches anything missed while disconnected.
  useEffect(() => {
    const reload = async () => {
      const res = await fetch(`/api/tickets/${ticket.id}`).catch(() => null);
      if (res?.ok) setFiles(((await res.json()) as { files: PrintFile[] }).files);
    };
    const es = new EventSource(`/api/tickets/${ticket.id}/stream`);
    es.onopen = () => void reload();
    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type !== "status-update") return;
      setFiles((prev) =>
        prev.map((f) => (f.id === data.fileId ? { ...f, status: data.status, printed_at: data.printedAt ?? f.printed_at } : f))
      );
    };
    return () => es.close();
  }, [ticket.id]);

  // Below lg the panel sits under the list, so bring it into view or the tap looks like it did nothing.
  const selectFile = (id: string) => {
    setSelectedId(id);
    if (window.matchMedia("(min-width: 1024px)").matches) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    panelRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
  };

  const selected = files.find((f) => f.id === selectedId) ?? files[0];
  const printable = files.filter((f) => f.status !== "cancelled");
  const doneCount = printable.filter((f) => f.status === "done").length;
  const allDone = printable.length > 0 && doneCount === printable.length;
  const totalCopies = printable.reduce((n, f) => n + (f.copies || 1), 0);

  const setStatus = async (fileId: string, status: PrintStatus) => {
    setBusyId(fileId);
    setError(null);
    try {
      const res = await fetch(`/api/staff/files/${fileId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      const { file } = (await res.json()) as { file: PrintFile };
      setFiles((prev) => prev.map((f) => (f.id === fileId ? file : f)));
    } catch {
      setError("Could not update the document. Check the connection and try again.");
    } finally {
      setBusyId(null);
    }
  };

  const openAndPrint = (file: PrintFile) => {
    if (!openTab(fileUrl(file))) return setError("The browser blocked the new tab. Allow pop-ups for this site and try again.");
    if (file.status === "queued") void setStatus(file.id, "printing");
  };

  // Browsers allow one new tab per click, so after the first, any blocked tab is reported rather than silently lost.
  const openAll = () => {
    const blocked = printable.filter((f) => !openTab(fileUrl(f))).length;
    setError(blocked ? `The browser blocked ${plural(blocked, "tab")}. Allow pop-ups for this site, then press Open all again.` : null);
  };

  // Cancelled documents stay cancelled; everything else is finished.
  const markAllDone = async () => {
    for (const file of files) {
      if (file.status === "queued" || file.status === "printing") await setStatus(file.id, "done");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-3xl font-bold tracking-tight">{ticket.ticket_code}</h1>
            {allDone && <StatusBadge status="done" />}
          </div>
          <p className="text-sm text-pretty break-words text-muted-foreground">
            <span className="font-medium text-foreground">{ticket.client_name}</span>
            {" · "}submitted {clockTime(ticket.created_at)} ({timeAgo(ticket.created_at)} ago)
            {" · "}
            {plural(printable.length, "document")}, {plural(totalCopies, "copy", "copies")}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {printable.length > 1 && (
            <Button variant="outline" className={TAP} onClick={openAll}>
              <ExternalLink data-icon="inline-start" aria-hidden="true" />
              {t("open_all")}
            </Button>
          )}
          {!allDone && printable.length > 0 && (
            <Button className={TAP} onClick={markAllDone} disabled={busyId !== null}>
              <CheckCheck data-icon="inline-start" aria-hidden="true" />
              {t("mark_all_done")}
            </Button>
          )}
        </div>
      </header>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
          <span>
            {doneCount} of {printable.length} printed
          </span>
          {allDone && <span>Ready for pickup</span>}
        </div>
        <div
          role="progressbar"
          aria-label="Documents printed"
          aria-valuemin={0}
          aria-valuemax={printable.length}
          aria-valuenow={doneCount}
          className="h-1.5 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${printable.length ? (doneCount / printable.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="gap-0 py-0 lg:sticky lg:top-20">
          <h2 className="border-b px-4 py-3 text-sm font-medium">Documents</h2>
          <ul className="flex flex-col p-2" aria-label="Documents">
            {files.map((file) => {
              const isSelected = file.id === selected?.id;
              return (
                <li key={file.id}>
                  <button
                    type="button"
                    onClick={() => selectFile(file.id)}
                    aria-current={isSelected ? "true" : undefined}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                      isSelected ? "bg-muted" : "hover:bg-muted/50",
                      file.status === "cancelled" && "opacity-60"
                    )}
                  >
                    <FileGlyph fileName={file.file_name} />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <FileName name={file.file_name} className="text-sm font-medium" />
                      <span className="truncate text-xs text-muted-foreground">{specLine(file)}</span>
                    </span>
                    {busyId === file.id ? <Spinner className="size-4" /> : <StatusDot status={file.status} />}
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        {selected && (
          <DocumentPanel
            ref={panelRef}
            file={selected}
            busy={busyId === selected.id}
            onPrint={() => openAndPrint(selected)}
            onStatus={(s) => setStatus(selected.id, s)}
            onCancel={() => setCancelId(selected.id)}
          />
        )}
      </div>

      <ConfirmDialog
        isOpen={cancelId !== null}
        title={t("confirm_cancel_title")}
        message={t("confirm_cancel_msg")}
        confirmLabel={t("confirm_cancel_action")}
        cancelLabel={t("keep_btn")}
        onConfirm={async () => {
          const id = cancelId;
          setCancelId(null);
          if (id) await setStatus(id, "cancelled");
        }}
        onCancel={() => setCancelId(null)}
      />
    </div>
  );
}

function StatusDot({ status }: { status: PrintStatus }) {
  const tone = {
    queued: "bg-amber-500",
    printing: "bg-primary animate-pulse-subtle",
    done: "bg-emerald-500",
    cancelled: "bg-rose-500",
  }[status];
  return (
    <span className="flex shrink-0 items-center" title={status}>
      <span className={cn("size-2 rounded-full", tone)} aria-hidden="true" />
      <span className="sr-only">{status}</span>
    </span>
  );
}

function DocumentPanel({
  ref,
  file,
  busy,
  onPrint,
  onStatus,
  onCancel,
}: {
  ref: Ref<HTMLDivElement>;
  file: PrintFile;
  busy: boolean;
  onPrint: () => void;
  onStatus: (s: PrintStatus) => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const url = fileUrl(file);
  const name = file.file_name.toLowerCase();
  const isPdf = file.file_type === "application/pdf" || name.endsWith(".pdf");
  const isImage = file.file_type.startsWith("image/") || /\.(png|jpe?g)$/.test(name);
  const active = file.status === "queued" || file.status === "printing";
  // Most phone browsers cannot show a PDF inside the page; there the Open button is the way in.
  const inlinePdf = useSyncExternalStore(noop, () => navigator.pdfViewerEnabled !== false, () => true);

  const specs = [
    ["Paper", file.paper_size || "A4"],
    ["Orientation", file.orientation === "landscape" ? "Landscape" : "Portrait"],
    ["Color", file.color_mode === "color" ? "Color" : "Black & white"],
    ["Sides", file.double_sided ? "Back-to-back" : "Single-sided"],
    ["Copies", String(file.copies || 1)],
    ["Pages", file.pages || "All"],
  ];

  return (
    <Card ref={ref} className="scroll-mt-20 gap-0 py-0">
      <div className="flex flex-col gap-3 border-b p-4 sm:p-5 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <FileName name={file.file_name} className="text-base font-semibold" />
          <StatusBadge status={file.status} size="sm" />
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {busy && <Spinner className="size-4 text-muted-foreground" />}
          {active && (
            <Button variant="ghost" onClick={onCancel} disabled={busy} className={cn(TAP, "text-muted-foreground hover:text-destructive")}>
              <XCircle data-icon="inline-start" aria-hidden="true" />
              {t("cancel_btn")}
            </Button>
          )}
          {file.status === "queued" && (
            <Button className={TAP} onClick={onPrint} disabled={busy}>
              <Printer data-icon="inline-start" aria-hidden="true" />
              {t("open_and_print")}
            </Button>
          )}
          {file.status === "printing" && (
            <>
              <Button variant="outline" className={TAP} onClick={onPrint}>
                <ExternalLink data-icon="inline-start" aria-hidden="true" />
                Open again
              </Button>
              <Button className={TAP} onClick={() => onStatus("done")} disabled={busy}>
                <CheckCheck data-icon="inline-start" aria-hidden="true" />
                {t("mark_done")}
              </Button>
            </>
          )}
          {!active && (
            <Button variant="outline" className={TAP} onClick={onPrint}>
              <ExternalLink data-icon="inline-start" aria-hidden="true" />
              Open
            </Button>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-b p-4 sm:grid-cols-3 sm:p-5 xl:grid-cols-6">
        {specs.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="text-sm font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      {file.notes && (
        <div className="border-b p-4 sm:p-5">
          <Alert className="border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            <StickyNote aria-hidden="true" />
            <AlertTitle>Customer note</AlertTitle>
            <AlertDescription className="text-amber-900 dark:text-amber-200">{file.notes}</AlertDescription>
          </Alert>
        </div>
      )}

      <div className="bg-muted/40 p-2 sm:p-4">
        {isPdf && inlinePdf ? (
          <iframe src={`${url}#toolbar=1`} title={`Preview of ${file.file_name}`} className="h-[70vh] min-h-[420px] w-full rounded-md border bg-background" />
        ) : isImage ? (
          <div className="flex max-h-[70vh] items-center justify-center overflow-auto rounded-md border bg-background p-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- private upload served by an auth route */}
            <img src={url} alt={file.file_name} className="max-h-[66vh] object-contain" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-md border bg-background px-6 py-16 text-center">
            <FileGlyph fileName={file.file_name} className="scale-150" />
            <p className="mt-2 text-sm font-medium">{isPdf ? "This browser can't preview PDFs here" : "No preview for this file type"}</p>
            <p className="max-w-xs text-xs text-muted-foreground">{isPdf ? "Open it in its own tab and print from there." : "Open it in its own tab and print from the browser or Word."}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
