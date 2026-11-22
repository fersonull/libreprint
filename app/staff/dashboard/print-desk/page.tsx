import { countTicketsByStatus, listTickets } from "@/features/staff/queries";
import { readListParams } from "@/features/staff/search-params";
import { PrintDesk } from "@/features/staff/print-desk/print-desk";

const FILTERS = ["active", "queued", "printing", "done", "all"] as const;
const SORTS = ["oldest", "newest"] as const;

export default async function PrintDeskPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = readListParams(await searchParams, { filters: FILTERS, filter: "active", sorts: SORTS, sort: "oldest" });
  const list = listTickets(params);
  return <PrintDesk list={list} counts={countTicketsByStatus()} filter={params.filter} sort={params.sort} />;
}
