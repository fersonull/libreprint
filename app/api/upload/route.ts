import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { generateTicketCode } from "@/lib/ticket-code";
import { saveFile } from "@/lib/storage";
import { emitStatusUpdate } from "@/lib/emitter";
import crypto from "crypto";

const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx", ".doc", ".png", ".jpg", ".jpeg"]);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const clientName = (formData.get("clientName") as string)?.trim();

    if (!clientName) {
      return NextResponse.json(
        { error: "Client name is required." },
        { status: 400 }
      );
    }

    const files = formData.getAll("files") as File[];
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "At least one document must be selected." },
        { status: 400 }
      );
    }

    // Parse per-file configuration metadata if provided
    const optionsRaw = formData.get("fileOptions") as string;
    let fileOptions: Record<
      string,
      {
        copies?: number;
        colorMode?: "bw" | "color";
        paperSize?: "Short (Letter)" | "A4" | "Long (Legal)" | "A3";
        orientation?: "portrait" | "landscape";
        doubleSided?: boolean;
        notes?: string;
      }
    > = {};

    if (optionsRaw) {
      try {
        fileOptions = JSON.parse(optionsRaw);
      } catch {
        // Fallback to default options if invalid JSON
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

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const originalName = file.name;
      const ext = originalName.substring(originalName.lastIndexOf(".")).toLowerCase();

      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return NextResponse.json(
          {
            error: `File "${originalName}" is not supported. Allowed formats: PDF, DOCX, DOC, PNG, JPG.`,
          },
          { status: 400 }
        );
      }

      const fileId = crypto.randomUUID();
      const arrayBuffer = await file.arrayBuffer();
      const { fileName } = await saveFile(fileId, originalName, arrayBuffer);

      const opts = fileOptions[originalName] || fileOptions[i] || {};
      const copies = Math.max(1, Math.min(50, Number(opts.copies) || 1));
      const colorMode = opts.colorMode === "color" ? "color" : "bw";
      const paperSize = opts.paperSize || "A4";
      const orientation = opts.orientation === "landscape" ? "landscape" : "portrait";
      const doubleSided = opts.doubleSided ? 1 : 0;
      const notes = opts.notes?.trim() || null;

      db.prepare(
        `INSERT INTO print_files 
        (id, ticket_id, file_name, file_path, file_type, file_size, copies, color_mode, paper_size, orientation, double_sided, notes, status, created_at, printed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'queued', ?, NULL)`
      ).run(
        fileId,
        ticketId,
        originalName,
        fileName,
        file.type || "application/octet-stream",
        file.size,
        copies,
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
