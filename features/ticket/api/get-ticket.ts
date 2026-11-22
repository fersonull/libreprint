import { NextResponse } from "next/server";
import { getTicketWithFiles } from "@/shared/server/tickets";

// Lookup by both UUID and ticket code (e.g. PQ-1234).
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const found = getTicketWithFiles(id);
    if (!found) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    return NextResponse.json(found);
  } catch (error) {
    console.error("Ticket fetch error:", error);
    return NextResponse.json({ error: "Failed to load ticket details." }, { status: 500 });
  }
}
