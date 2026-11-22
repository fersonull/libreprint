import { NextResponse } from "next/server";
import { getDb, PrintFile } from "@/shared/server/db";
import { isStaffAuthenticated } from "@/shared/server/staff-session";
import { emitStatusUpdate } from "@/shared/server/live-updates";

const VALID_STATUSES = new Set(["queued", "printing", "done", "cancelled"]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthed = await isStaffAuthenticated();
    if (!isAuthed) {
      return NextResponse.json(
        { error: "Unauthorized. Staff session required." },
        { status: 401 }
      );
    }

    const { id: fileId } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.has(status)) {
      return NextResponse.json(
        { error: "Invalid status value provided." },
        { status: 400 }
      );
    }

    const db = getDb();
    const existingFile = db
      .prepare("SELECT * FROM print_files WHERE id = ?")
      .get(fileId) as PrintFile | undefined;

    if (!existingFile) {
      return NextResponse.json(
        { error: "Print file not found." },
        { status: 404 }
      );
    }

    const now = Date.now();
    const printedAt = status === "done" ? now : existingFile.printed_at;

    db.prepare(
      "UPDATE print_files SET status = ?, printed_at = ? WHERE id = ?"
    ).run(status, printedAt, fileId);

    const updatedFile = db
      .prepare("SELECT * FROM print_files WHERE id = ?")
      .get(fileId) as PrintFile;

    // Broadcast update through Server-Sent Events
    emitStatusUpdate({
      ticketId: existingFile.ticket_id,
      fileId,
      status: status as "queued" | "printing" | "done" | "cancelled",
      printedAt,
    });

    return NextResponse.json({
      success: true,
      file: updatedFile,
    });
  } catch (error) {
    console.error("Status update error:", error);
    return NextResponse.json(
      { error: "Failed to update print status." },
      { status: 500 }
    );
  }
}
