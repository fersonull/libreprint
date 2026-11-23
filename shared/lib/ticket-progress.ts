import type { PrintFile } from "@/shared/server/db";

export type TicketProgress = ReturnType<typeof ticketProgress>;
export type ProgressEvent = "printing" | "ready";

/**
 * Where a ticket stands for the customer. Cancelled documents will never be
 * printed, so they neither count toward progress nor hold up pickup.
 */
export function ticketProgress(files: Pick<PrintFile, "status">[]) {
  const printable = files.filter((f) => f.status !== "cancelled");
  const done = printable.filter((f) => f.status === "done").length;
  const printing = printable.filter((f) => f.status === "printing").length;
  return {
    total: printable.length,
    done,
    printing,
    allDone: printable.length > 0 && done === printable.length,
    allCancelled: files.length > 0 && printable.length === 0,
  };
}

/** The moments worth telling the customer about between two snapshots of the same ticket. */
export function progressEvents(before: TicketProgress, after: TicketProgress): ProgressEvent[] {
  const events: ProgressEvent[] = [];
  const started = (p: TicketProgress) => p.printing > 0 || p.done > 0;
  if (!started(before) && started(after) && !after.allDone) events.push("printing");
  if (after.allDone && !before.allDone) events.push("ready");
  return events;
}
