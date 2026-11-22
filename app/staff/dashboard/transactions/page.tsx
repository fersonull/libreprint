import { countTicketsByStatus, listTickets } from "@/features/staff/queries";
import { readListParams } from "@/features/staff/search-params";
import { TRANSACTION_FILTERS, TRANSACTION_SORTS } from "@/features/staff/transactions/options";
import { TransactionsTable } from "@/features/staff/transactions/transactions-table";

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
