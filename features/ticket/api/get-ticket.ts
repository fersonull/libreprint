import { NextResponse } from "next/server";
import { getTicketWithFiles, isCodeLookupLimited } from "@/shared/server/tickets";

// Lookup by both UUID and ticket code (e.g. PQ-481920).
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (isCodeLookupLimited(id, request.headers)) {
      return NextResponse.json({ error: "Too many lookups. Try again in a few minutes." }, { status: 429 });
    }
    const found = getTicketWithFiles(id);
    if (!found) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    return NextResponse.json(found);
  } catch (error) {
    console.error("Ticket fetch error:", error);
    return NextResponse.json({ error: "Failed to load ticket details." }, { status: 500 });
  }
}
