import type { PrintFile } from "@/lib/db";

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
