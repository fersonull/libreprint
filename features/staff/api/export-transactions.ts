import { isStaffAuthenticated } from "@/shared/server/staff-session";
import { listTickets } from "../queries";
import { readListParams } from "../search-params";
import { TRANSACTION_FILTERS, TRANSACTION_SORTS } from "../transactions/options";

// Quote every cell, and defuse spreadsheet formulas (=, +, -, @) in user text.
function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${(/^[=+@\-\t\r]/.test(text) ? "'" : "") + text.replaceAll('"', '""')}"`;
}

/** Every transaction matching the current filters, not just the visible page. */
export async function GET(request: Request) {
  if (!(await isStaffAuthenticated())) {
    return Response.json({ error: "Unauthorized. Staff session required." }, { status: 401 });
  }
  const params = readListParams(Object.fromEntries(new URL(request.url).searchParams), {
    filters: TRANSACTION_FILTERS,
    filter: "all",
    sorts: TRANSACTION_SORTS,
    sort: "newest",
  });
  const { rows } = listTickets({ ...params, pageSize: null });
  const lines = [
    ["Ticket", "Client", "Created", "Documents", "Copies", "Status"],
    ...rows.map((r) => [r.ticket_code, r.client_name, new Date(r.created_at).toISOString(), r.file_names, r.copies, r.status]),
  ];
  return new Response(lines.map((line) => line.map(csvCell).join(",")).join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="transactions.csv"',
      "Cache-Control": "no-store",
    },
  });
}
