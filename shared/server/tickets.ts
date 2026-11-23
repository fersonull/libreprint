import "server-only";
import { getDb, type PrintFile, type Ticket } from "@/shared/server/db";
import { clientIp, isRateLimited } from "@/shared/server/rate-limit";

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

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Claim codes are short enough to guess, so lookups by code are capped per visitor.
 * Ticket ids are random UUIDs and stay unlimited (the live tracker polls by id).
 */
export function isCodeLookupLimited(idOrCode: string, headers: Headers) {
  return !UUID.test(idOrCode) && isRateLimited(`lookup:${clientIp(headers)}`, 20, 10 * 60_000);
}
