import "server-only";
import { getDb, type Ticket } from "@/shared/server/db";
import type { PrintStatus } from "@/shared/components/status-badge";

/** One ticket with its files rolled up, as every staff list shows it. */
export interface TicketSummary extends Ticket {
  status: PrintStatus;
  file_count: number;
  copies: number;
  done_count: number;
  color_files: number;
  has_notes: number;
  file_names: string;
  finished_at: number | null;
}

export type TicketFilter = "active" | "all" | PrintStatus;
export type TicketSort = "newest" | "oldest" | "client" | "files";

// A ticket is printing if any file is, queued if any file waits, cancelled if
// every file was cancelled, otherwise done.
const SUMMARY_SQL = `
  WITH summary AS (
    SELECT t.id, t.ticket_code, t.client_name, t.created_at,
      COUNT(f.id) AS file_count,
      COALESCE(SUM(f.copies), 0) AS copies,
      COALESCE(SUM(f.status = 'done'), 0) AS done_count,
      COALESCE(SUM(f.color_mode = 'color'), 0) AS color_files,
      COALESCE(SUM(f.notes IS NOT NULL AND f.notes <> ''), 0) AS has_notes,
      COALESCE(GROUP_CONCAT(f.file_name, ', '), '') AS file_names,
      MAX(f.printed_at) AS finished_at,
      CASE
        WHEN SUM(f.status = 'printing') > 0 THEN 'printing'
        WHEN SUM(f.status = 'queued') > 0 THEN 'queued'
        WHEN COUNT(f.id) > 0 AND SUM(f.status = 'cancelled') = COUNT(f.id) THEN 'cancelled'
        ELSE 'done'
      END AS status
    FROM tickets t
    LEFT JOIN print_files f ON f.ticket_id = t.id
    GROUP BY t.id
  )`;

const ORDER_BY: Record<TicketSort, string> = {
  newest: "created_at DESC",
  oldest: "created_at ASC",
  client: "client_name COLLATE NOCASE ASC, created_at DESC",
  files: "file_count DESC, created_at DESC",
};

export const PAGE_SIZE = 20;

export function listTickets({
  filter = "all",
  q = "",
  sort = "newest",
  page = 1,
  pageSize = PAGE_SIZE,
}: {
  filter?: TicketFilter;
  q?: string;
  sort?: TicketSort;
  page?: number;
  /** null returns every match (CSV export). */
  pageSize?: number | null;
}) {
  const db = getDb();
  const where: string[] = [];
  const params: unknown[] = [];

  if (filter === "active") where.push("status IN ('queued', 'printing')");
  else if (filter !== "all") {
    where.push("status = ?");
    params.push(filter);
  }
  const query = q.trim();
  if (query) {
    where.push("(ticket_code LIKE ? ESCAPE '\\' OR client_name LIKE ? ESCAPE '\\')");
    const like = `%${query.replace(/[\\%_]/g, "\\$&")}%`;
    params.push(like, like);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const { total } = db
    .prepare(`${SUMMARY_SQL} SELECT COUNT(*) AS total FROM summary ${whereSql}`)
    .get(...params) as { total: number };

  const pageCount = pageSize ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const current = Math.min(Math.max(1, page), pageCount);
  const limitSql = pageSize ? `LIMIT ${pageSize} OFFSET ${(current - 1) * pageSize}` : "";

  const rows = db
    .prepare(`${SUMMARY_SQL} SELECT * FROM summary ${whereSql} ORDER BY ${ORDER_BY[sort]} ${limitSql}`)
    .all(...params) as TicketSummary[];

  return { rows, total, page: current, pageCount, pageSize: pageSize ?? total };
}

/** Ticket counts per status, for filter tabs. */
export function countTicketsByStatus(): Record<PrintStatus, number> {
  const rows = getDb()
    .prepare(`${SUMMARY_SQL} SELECT status, COUNT(*) AS n FROM summary GROUP BY status`)
    .all() as { status: PrintStatus; n: number }[];
  const counts = { queued: 0, printing: 0, done: 0, cancelled: 0 };
  for (const { status, n } of rows) counts[status] = n;
  return counts;
}

/** Hides all but the last two digits, so the public board can't be used to open other people's tickets. */
export function maskTicketCode(code: string) {
  return code.replace(/\d(?=\d{2})/g, "•");
}

export type PublicQueueEntry = { code: string; status: PrintStatus };

/** The customer-facing board: only masked codes and status, never names or file names. */
export function listPublicQueue() {
  const db = getDb();
  const waiting = db
    .prepare(`${SUMMARY_SQL} SELECT ticket_code, status FROM summary WHERE status IN ('queued', 'printing')
      ORDER BY status = 'printing' DESC, created_at ASC`)
    .all() as { ticket_code: string; status: PrintStatus }[];
  const ready = db
    .prepare(`${SUMMARY_SQL} SELECT ticket_code, status FROM summary WHERE status = 'done' AND finished_at >= ?
      ORDER BY finished_at DESC LIMIT 30`)
    .all(startOfToday()) as { ticket_code: string; status: PrintStatus }[];
  const toEntry = (r: { ticket_code: string; status: PrintStatus }): PublicQueueEntry => ({
    code: maskTicketCode(r.ticket_code),
    status: r.status,
  });
  return { waiting: waiting.map(toEntry), ready: ready.map(toEntry) };
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function getOverview() {
  const db = getDb();
  const today = startOfToday();

  const files = db
    .prepare(
      `SELECT
        COALESCE(SUM(status = 'queued'), 0) AS queued,
        COALESCE(SUM(status = 'printing'), 0) AS printing,
        COALESCE(SUM(status = 'done' AND printed_at >= ?), 0) AS done_today,
        COALESCE(SUM(CASE WHEN status = 'done' AND printed_at >= ? THEN copies ELSE 0 END), 0) AS copies_today
      FROM print_files`
    )
    .get(today, today) as { queued: number; printing: number; done_today: number; copies_today: number };

  const { tickets_today } = db
    .prepare("SELECT COUNT(*) AS tickets_today FROM tickets WHERE created_at >= ?")
    .get(today) as { tickets_today: number };

  const upNext = db
    .prepare(`${SUMMARY_SQL} SELECT * FROM summary WHERE status IN ('queued', 'printing')
      ORDER BY status = 'printing' DESC, created_at ASC LIMIT 6`)
    .all() as TicketSummary[];

  const recentlyDone = db
    .prepare(`${SUMMARY_SQL} SELECT * FROM summary WHERE status = 'done' AND finished_at IS NOT NULL
      ORDER BY finished_at DESC LIMIT 6`)
    .all() as TicketSummary[];

  // Last 7 local days, oldest first, zero-filled.
  const since = today - 6 * 86_400_000;
  const created = db
    .prepare("SELECT created_at FROM tickets WHERE created_at >= ?")
    .all(since) as { created_at: number }[];
  const daily = Array.from({ length: 7 }, (_, i) => {
    const start = new Date(since);
    start.setDate(start.getDate() + i);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return {
      label: start.toLocaleDateString("en", { month: "short", day: "numeric" }),
      tickets: created.filter((t) => t.created_at >= start.getTime() && t.created_at < end.getTime()).length,
    };
  });

  const byStatus = countTicketsByStatus();
  return { ...files, tickets_today, active_tickets: byStatus.queued + byStatus.printing, upNext, recentlyDone, daily };
}
