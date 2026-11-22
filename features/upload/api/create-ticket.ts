import { NextResponse } from "next/server";
import { getDb } from "@/shared/server/db";
import { generateTicketCode } from "../ticket-code";
import { saveFile } from "@/shared/server/storage";
import { emitStatusUpdate } from "@/shared/server/live-updates";
import { MAX_FILE_SIZE_BYTES, MAX_TOTAL_UPLOAD_BYTES, MAX_UPLOAD_REQUEST_BYTES } from "../limits";
import crypto from "crypto";

const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx", ".doc", ".png", ".jpg", ".jpeg"]);
type FileOptions = {
  copies?: number;
  colorMode?: "bw" | "color";
  paperSize?: "Short (Letter)" | "A4" | "Long (Legal)" | "A3";
  orientation?: "portrait" | "landscape";
  doubleSided?: boolean;
  pages?: string;
  notes?: string;
};

async function readLimitedFormData(request: Request): Promise<FormData | null> {
  const reader = request.body?.getReader();
  if (!reader) return new FormData();

  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    byteLength += value.byteLength;
    if (byteLength > MAX_UPLOAD_REQUEST_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  const body = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body,
  }).formData();
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length"));
    if (contentLength > MAX_UPLOAD_REQUEST_BYTES) {
      return NextResponse.json({ error: "Upload request exceeds the 105 MB limit." }, { status: 413 });
    }

    let formData: FormData | null;
    try {
      formData = await readLimitedFormData(request);
    } catch {
      return NextResponse.json({ error: "Invalid upload form data." }, { status: 400 });
    }
    if (!formData) {
      return NextResponse.json({ error: "Upload request exceeds the 105 MB limit." }, { status: 413 });
    }
    const clientName = (formData.get("clientName") as string)?.trim();

    if (!clientName) {
      return NextResponse.json(
        { error: "Client name is required." },
        { status: 400 }
      );
    }

    const files = formData.getAll("files");
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "At least one document must be selected." },
        { status: 400 }
      );
    }

    // Parse per-file configuration metadata if provided
    const optionsRaw = formData.get("fileOptions");
    let fileOptions: FileOptions[] = files.map(() => ({}));
    if (optionsRaw !== null) {
      if (typeof optionsRaw !== "string") {
        return NextResponse.json({ error: "Invalid print settings." }, { status: 400 });
      }
      try {
        const parsed: unknown = JSON.parse(optionsRaw);
        if (!Array.isArray(parsed) || parsed.length !== files.length || parsed.some((options) => !options || typeof options !== "object" || Array.isArray(options))) {
          return NextResponse.json({ error: "Invalid print settings." }, { status: 400 });
        }
        fileOptions = parsed as FileOptions[];
      } catch {
        return NextResponse.json({ error: "Invalid print settings." }, { status: 400 });
      }
    }

    let totalFileBytes = 0;
    const uploadedFiles: File[] = [];
    for (const [index, entry] of files.entries()) {
      if (!(entry instanceof File)) {
        return NextResponse.json({ error: "Invalid uploaded file." }, { status: 400 });
      }
      const file = entry;
      uploadedFiles.push(file);
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return NextResponse.json({ error: `File "${file.name}" is not supported. Allowed formats: PDF, DOCX, DOC, PNG, JPG.` }, { status: 400 });
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json({ error: `File "${file.name}" exceeds the 50 MB per-file limit.` }, { status: 413 });
      }
      totalFileBytes += file.size;
      if (totalFileBytes > MAX_TOTAL_UPLOAD_BYTES) {
        return NextResponse.json({ error: "Combined files exceed the 100 MB upload limit." }, { status: 413 });
      }

      const option = fileOptions[index];
      if (
        (option.copies !== undefined && (typeof option.copies !== "number" || !Number.isInteger(option.copies) || option.copies < 1 || option.copies > 50)) ||
        (option.colorMode !== undefined && option.colorMode !== "bw" && option.colorMode !== "color") ||
        (option.paperSize !== undefined && !["Short (Letter)", "A4", "Long (Legal)", "A3"].includes(option.paperSize)) ||
        (option.orientation !== undefined && option.orientation !== "portrait" && option.orientation !== "landscape") ||
        (option.doubleSided !== undefined && typeof option.doubleSided !== "boolean") ||
        (option.pages !== undefined && typeof option.pages !== "string") ||
        (option.notes !== undefined && (typeof option.notes !== "string" || option.notes.length > 120))
      ) {
        return NextResponse.json({ error: `Invalid print settings for "${file.name}".` }, { status: 400 });
      }
      const pages = option.pages?.trim() || "All";
      if (pages.toLowerCase() !== "all" && !/^\d+(?:\s*[-,]\s*\d+)*$/.test(pages)) {
        return NextResponse.json({ error: `Invalid page selection for "${file.name}".` }, { status: 400 });
      }
    }

    const db = getDb();
    const ticketId = crypto.randomUUID();
    const ticketCode = generateTicketCode();
    const now = Date.now();

    // Begin ticket insert
    db.prepare(
      "INSERT INTO tickets (id, ticket_code, client_name, created_at) VALUES (?, ?, ?, ?)"
    ).run(ticketId, ticketCode, clientName, now);

    const savedFilesList = [];

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      const originalName = file.name;
      const fileId = crypto.randomUUID();
      const arrayBuffer = await file.arrayBuffer();
      const { fileName } = await saveFile(fileId, originalName, arrayBuffer);

      const opts = fileOptions[i];
      const copies = Math.max(1, Math.min(50, Number(opts.copies) || 1));
      const colorMode = opts.colorMode === "color" ? "color" : "bw";
      const paperSize = opts.paperSize || "A4";
      const orientation = opts.orientation === "landscape" ? "landscape" : "portrait";
      const doubleSided = opts.doubleSided ? 1 : 0;
      const notes = opts.notes?.trim() || null;
      const pages = opts.pages?.trim().toLowerCase() === "all" ? "All" : opts.pages?.trim() || "All";

      db.prepare(
        `INSERT INTO print_files 
        (id, ticket_id, file_name, file_path, file_type, file_size, copies, pages, color_mode, paper_size, orientation, double_sided, notes, status, created_at, printed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'queued', ?, NULL)`
      ).run(
        fileId,
        ticketId,
        originalName,
        fileName,
        file.type || "application/octet-stream",
        file.size,
        copies,
        pages,
        colorMode,
        paperSize,
        orientation,
        doubleSided,
        notes,
        now
      );

      savedFilesList.push({
        id: fileId,
        fileName: originalName,
        status: "queued",
        copies,
        colorMode,
        paperSize,
        orientation,
        doubleSided,
        notes,
      });

      emitStatusUpdate({
        ticketId,
        fileId,
        status: "queued",
      });
    }

    return NextResponse.json({
      success: true,
      ticketId,
      ticketCode,
      clientName,
      filesCount: savedFilesList.length,
    });
  } catch (error) {
    console.error("Upload error details:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process upload. Please try again." },
      { status: 500 }
    );
  }
}
