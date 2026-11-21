import { NextResponse } from "next/server";
import { getDb, Ticket, PrintFile } from "@/lib/db";
import { isStaffAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const isAuthed = await isStaffAuthenticated();
    if (!isAuthed) {
      return NextResponse.json(
        { error: "Unauthorized. Staff session required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filterStatus = searchParams.get("status");

    const db = getDb();

    // Query tickets
    const tickets = db
      .prepare("SELECT * FROM tickets ORDER BY created_at DESC")
      .all() as Ticket[];

    // Query all files
    const allFiles = db
      .prepare("SELECT * FROM print_files ORDER BY created_at ASC")
      .all() as PrintFile[];

    // Group files by ticket_id
    const filesByTicket = new Map<string, PrintFile[]>();
    for (const file of allFiles) {
      const list = filesByTicket.get(file.ticket_id) || [];
      list.push(file);
      filesByTicket.set(file.ticket_id, list);
    }

    // Attach files to tickets
    let ticketsWithFiles = tickets.map((t) => ({
      ...t,
      files: filesByTicket.get(t.id) || [],
    }));

    // Filter if status provided
    if (filterStatus && filterStatus !== "all") {
      ticketsWithFiles = ticketsWithFiles.filter((t) =>
        t.files.some((f) => f.status === filterStatus)
      );
    }

    // Compute queue statistics
    const stats = {
      totalTickets: tickets.length,
      totalFiles: allFiles.length,
      queuedFiles: allFiles.filter((f) => f.status === "queued").length,
      printingFiles: allFiles.filter((f) => f.status === "printing").length,
      doneFiles: allFiles.filter((f) => f.status === "done").length,
      cancelledFiles: allFiles.filter((f) => f.status === "cancelled").length,
    };

    return NextResponse.json({
      tickets: ticketsWithFiles,
      stats,
    });
  } catch (error) {
    console.error("Staff tickets fetch error:", error);
    return NextResponse.json(
      { error: "Failed to load print tickets." },
      { status: 500 }
    );
  }
}
