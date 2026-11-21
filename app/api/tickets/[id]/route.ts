import { NextResponse } from "next/server";
import { getDb, Ticket, PrintFile } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    // Support lookup by both UUID and ticket code (e.g. PQ-1234)
    const ticket = db
      .prepare(
        "SELECT * FROM tickets WHERE id = ? OR UPPER(ticket_code) = UPPER(?)"
      )
      .get(id, id) as Ticket | undefined;

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found." },
        { status: 404 }
      );
    }

    const files = db
      .prepare(
        "SELECT * FROM print_files WHERE ticket_id = ? ORDER BY created_at ASC"
      )
      .all(ticket.id) as PrintFile[];

    return NextResponse.json({
      ticket,
      files,
    });
  } catch (error) {
    console.error("Ticket fetch error:", error);
    return NextResponse.json(
      { error: "Failed to load ticket details." },
      { status: 500 }
    );
  }
}
