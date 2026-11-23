// Read-only self-check for the staff SQL against the local database.
// Run: bun --conditions=react-server run features/staff/queries.check.ts
import { countTicketsByStatus, getOverview, listTickets } from "./queries";

const all = listTickets({ pageSize: null });
const counts = countTicketsByStatus();
const sum = Object.values(counts).reduce((a, b) => a + b, 0);
console.assert(sum === all.total, "status counts add up to the ticket total", { sum, total: all.total });

const last = listTickets({ page: 999, pageSize: 5 });
console.assert(last.page === last.pageCount, "out-of-range page clamps to the last page");
console.assert(last.rows.length <= 5, "page size is respected");

const wild = listTickets({ q: "%_\\" });
console.assert(wild.total === 0 || all.total > 0, "LIKE wildcards in search are escaped");

const overview = getOverview();
console.assert(overview.upNext.every((t) => t.status === "queued" || t.status === "printing"), "up next holds only active tickets");
console.assert(overview.recentlyDone.every((t) => t.status === "done"), "recently done holds only finished tickets");
console.assert(overview.daily.length === 7, "seven days of history");

console.log("staff queries ok", { tickets: all.total, counts });

const { pageWindow } = await import("./format");
console.assert(JSON.stringify(pageWindow(1, 1)) === "[1]", "single page");
console.assert(JSON.stringify(pageWindow(5, 10)) === JSON.stringify([1, "…", 4, 5, 6, "…", 10]), "window with gaps");
console.assert(JSON.stringify(pageWindow(2, 3)) === "[1,2,3]", "no gap between neighbours");

const { listPublicQueue, maskTicketCode } = await import("./queries");
console.assert(maskTicketCode("PQ-481920") === "PQ-••••20", "codes keep only the last two digits");
const board = listPublicQueue();
console.assert([...board.waiting, ...board.ready].every((e) => !/\d{3}/.test(e.code) && Object.keys(e).join() === "code,status"), "public board leaks only masked codes and status");
console.assert(board.ready.every((e) => e.status === "done"), "ready column holds only finished tickets");
