import "server-only";
import fs from "fs";
import path from "path";
import { generateVAPIDKeys, sendNotification, setVapidDetails, WebPushError } from "web-push";
import { getDb, type PrintFile, type Ticket } from "@/shared/server/db";
import { MESSAGES } from "@/shared/i18n/messages";
import { progressEvents, ticketProgress, type ProgressEvent, type TicketProgress } from "@/shared/lib/ticket-progress";

type Keys = { publicKey: string; privateKey: string };
let keys: Keys | null = null;

/** VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY, or a pair generated once and kept in data/ so subscriptions survive restarts. */
function getKeys(): Keys {
  if (keys) return keys;
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    keys = { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY };
  } else {
    const file = path.join(process.cwd(), "data", ".vapid.json");
    try {
      keys = JSON.parse(fs.readFileSync(file, "utf8")) as Keys;
    } catch {
      keys = generateVAPIDKeys();
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(keys), { mode: 0o600 });
    }
  }
  // Push services want a real contact; Apple rejects localhost-style subjects.
  setVapidDetails(process.env.VAPID_SUBJECT || "mailto:noreply@example.com", keys.publicKey, keys.privateKey);
  return keys;
}

export function getVapidPublicKey() {
  return getKeys().publicKey;
}

export function ticketFiles(ticketId: string) {
  return getDb().prepare("SELECT status FROM print_files WHERE ticket_id = ?").all(ticketId) as Pick<PrintFile, "status">[];
}

const COLUMN: Record<ProgressEvent, string> = { printing: "notified_printing_at", ready: "notified_ready_at" };

/**
 * Sends "printing" / "ready" push notifications for a ticket whose files just changed.
 * Never throws: a push failure must not fail the staff action that caused it.
 */
export async function notifyTicketProgress(ticketId: string, before: TicketProgress) {
  try {
    const db = getDb();
    const events = progressEvents(before, ticketProgress(ticketFiles(ticketId)));
    if (events.length === 0) return;

    const ticket = db.prepare("SELECT * FROM tickets WHERE id = ?").get(ticketId) as
      | (Ticket & { notified_printing_at: number | null; notified_ready_at: number | null })
      | undefined;
    if (!ticket) return;
    // Claim each event before sending, so two quick status changes can't both send it.
    const fresh = events.filter(
      (e) => (db.prepare(`UPDATE tickets SET ${COLUMN[e]} = ? WHERE id = ? AND ${COLUMN[e]} IS NULL`).run(Date.now(), ticketId) as { changes: number }).changes > 0
    );
    // "Ready" says it all; don't send "printing" in the same breath.
    const event = fresh.includes("ready") ? "ready" : fresh[0];
    if (!event) return;

    const subs = db
      .prepare("SELECT endpoint, p256dh, auth, lang FROM push_subscriptions WHERE ticket_id = ?")
      .all(ticketId) as { endpoint: string; p256dh: string; auth: string; lang: string }[];
    if (subs.length === 0) return;

    getKeys();
    await Promise.all(
      subs.map(async (sub) => {
        const text = (key: string) =>
          (MESSAGES[sub.lang]?.[key] || MESSAGES.en[key]).replace("{code}", ticket.ticket_code);
        const payload = JSON.stringify({
          title: text(`notify_${event}_title`),
          body: text(`notify_${event}_body`),
          url: `/ticket/${ticket.id}`,
          tag: ticket.id,
        });
        try {
          await sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload, { TTL: 60 * 60 * 6 });
        } catch (err) {
          // 404/410: the browser dropped this subscription for good.
          if (err instanceof WebPushError && (err.statusCode === 404 || err.statusCode === 410)) {
            db.prepare("DELETE FROM push_subscriptions WHERE endpoint = ? AND ticket_id = ?").run(sub.endpoint, ticketId);
          } else {
            console.warn("Push notification failed:", err instanceof Error ? err.message : err);
          }
        }
      })
    );
  } catch (err) {
    console.error("notifyTicketProgress failed:", err);
  }
}
