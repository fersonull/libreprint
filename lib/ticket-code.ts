import { getDb } from "./db";

/**
 * Generates a clean human-readable ticket code e.g. PQ-4819
 */
export function generateTicketCode(): string {
  const db = getDb();
  let code = "";
  let exists = true;
  let attempts = 0;

  while (exists && attempts < 20) {
    attempts++;
    // Generate 4 random digits (1000 - 9999)
    const num = Math.floor(1000 + Math.random() * 9000);
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
