import { countTicketsByStatus, listTickets } from "@/features/staff/server";
import { TRANSACTION_FILTERS, TRANSACTION_SORTS, TransactionsTable, readListParams } from "@/features/staff";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = readListParams(await searchParams, {
    filters: TRANSACTION_FILTERS,
    filter: "all",
    sorts: TRANSACTION_SORTS,
    sort: "newest",
  });
  return <TransactionsTable list={listTickets(params)} counts={countTicketsByStatus()} filter={params.filter} sort={params.sort} />;
}
