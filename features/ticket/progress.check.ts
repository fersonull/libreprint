// Self-check for ticket progress. Run: bun run features/ticket/progress.check.ts
import { ticketProgress } from "./progress";

const s = (...statuses: ("queued" | "printing" | "done" | "cancelled")[]) => statuses.map((status) => ({ status }));

console.assert(ticketProgress(s("done", "cancelled")).allDone, "a cancelled document does not block pickup");
console.assert(ticketProgress(s("done", "cancelled")).total === 1, "cancelled documents are left out of the total");
console.assert(!ticketProgress(s("done", "queued")).allDone, "a waiting document still blocks pickup");
console.assert(ticketProgress(s("cancelled", "cancelled")).allCancelled, "all cancelled is its own state");
console.assert(!ticketProgress(s("cancelled", "cancelled")).allDone, "all cancelled is not ready for pickup");
console.assert(!ticketProgress([]).allDone && !ticketProgress([]).allCancelled, "no documents is neither");
console.log("ticket progress ok");
