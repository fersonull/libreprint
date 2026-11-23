import { randomInt } from "crypto";
import { getDb } from "@/shared/server/db";

/**
 * Generates a human-readable ticket code e.g. PQ-481920. Six digits so the
 * public board (which shows the last two) still leaves 10,000 guesses per ticket.
 */
export function generateTicketCode(): string {
  const db = getDb();
  let code = "";
  let exists = true;
  let attempts = 0;

  while (exists && attempts < 20) {
    attempts++;
    const num = randomInt(100_000, 1_000_000);
    code = `PQ-${num}`;

    const existing = db
      .prepare("SELECT ticket_code FROM tickets WHERE ticket_code = ?")
      .get(code);

    if (!existing) {
      exists = false;
    }
  }

  return code;
}
