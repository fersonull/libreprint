import "server-only";
import { getDb, type PrintFile, type Ticket } from "@/shared/server/db";

/** A ticket by id or claim code (any case), with its files in upload order. */
export function getTicketWithFiles(idOrCode: string) {
  const db = getDb();
  const ticket = db
    .prepare("SELECT * FROM tickets WHERE id = ? OR UPPER(ticket_code) = UPPER(?)")
    .get(idOrCode, idOrCode) as Ticket | undefined;
  if (!ticket) return null;
  const files = db
    .prepare("SELECT * FROM print_files WHERE ticket_id = ? ORDER BY created_at ASC")
    .all(ticket.id) as PrintFile[];
  return { ticket, files };
}
