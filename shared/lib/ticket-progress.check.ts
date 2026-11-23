// Self-check for ticket progress. Run: bun run shared/lib/ticket-progress.check.ts
import { progressEvents, ticketProgress } from "./ticket-progress";

type S = "queued" | "printing" | "done" | "cancelled";
const s = (...statuses: S[]) => statuses.map((status) => ({ status }));
const ev = (before: S[], after: S[]) => progressEvents(ticketProgress(s(...before)), ticketProgress(s(...after))).join();

console.assert(ticketProgress(s("done", "cancelled")).allDone, "a cancelled document does not block pickup");
console.assert(ticketProgress(s("done", "cancelled")).total === 1, "cancelled documents are left out of the total");
console.assert(!ticketProgress(s("done", "queued")).allDone, "a waiting document still blocks pickup");
console.assert(ticketProgress(s("cancelled", "cancelled")).allCancelled, "all cancelled is its own state");
console.assert(!ticketProgress(s("cancelled", "cancelled")).allDone, "all cancelled is not ready for pickup");
console.assert(!ticketProgress([]).allDone && !ticketProgress([]).allCancelled, "no documents is neither");

console.assert(ev(["queued", "queued"], ["printing", "queued"]) === "printing", "first document printing");
console.assert(ev(["printing", "queued"], ["printing", "printing"]) === "", "second document printing is not news");
console.assert(ev(["printing", "queued"], ["done", "queued"]) === "", "one of two done is not ready");
console.assert(ev(["done", "printing"], ["done", "done"]) === "ready", "last document done");
console.assert(ev(["queued"], ["done"]) === "ready", "straight to done skips the printing message");
console.assert(ev(["done", "queued"], ["done", "cancelled"]) === "ready", "cancelling the last waiting document makes it ready");
console.assert(ev(["queued", "queued"], ["cancelled", "cancelled"]) === "", "cancelling everything is not ready");
console.assert(ev(["done"], ["done"]) === "", "no change, no event");
console.log("ticket progress ok");
