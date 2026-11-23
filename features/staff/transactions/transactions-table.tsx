"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Download } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { StatusBadge, type PrintStatus } from "@/shared/components/status-badge";
import type { TicketSummary } from "../queries";
import { Pager } from "@/shared/components/pager";
import { TicketFilters } from "../ticket-filters";
import { dateTime } from "../format";

export function TransactionsTable({
  list,
  counts,
  filter,
  sort,
}: {
  list: { rows: TicketSummary[]; total: number; page: number; pageCount: number; pageSize: number };
  counts: Record<PrintStatus, number>;
  filter: string;
  sort: string;
}) {
  const params = useSearchParams();
  const exportParams = new URLSearchParams(params);
  exportParams.delete("page");
  const exportHref = `/api/staff/transactions/export${exportParams.size ? `?${exportParams}` : ""}`;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
        <p className="text-sm text-muted-foreground">Every ticket ever submitted. Search, filter and export.</p>
      </header>

      <TicketFilters
        tabs={[
          { value: "all", label: "All", count: counts.queued + counts.printing + counts.done + counts.cancelled },
          { value: "queued", label: "Queued", count: counts.queued },
          { value: "printing", label: "Printing", count: counts.printing },
          { value: "done", label: "Completed", count: counts.done },
          { value: "cancelled", label: "Cancelled", count: counts.cancelled },
        ]}
        filter={filter}
        defaultFilter="all"
        sorts={[
          { value: "newest", label: "Newest first" },
          { value: "oldest", label: "Oldest first" },
          { value: "client", label: "Client name" },
          { value: "files", label: "Most documents" },
        ]}
        sort={sort}
        defaultSort="newest"
        searchPlaceholder="Search ticket or client"
      >
        <Button asChild variant="outline" className="h-10 sm:h-9">
          <a href={exportHref} download>
            <Download data-icon="inline-start" aria-hidden="true" />
            Export CSV
          </a>
        </Button>
      </TicketFilters>

      <Card className="gap-0 py-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4 sm:pl-6">Ticket</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="hidden sm:table-cell">Submitted</TableHead>
              <TableHead className="hidden md:table-cell text-right">Docs</TableHead>
              <TableHead className="pr-4 sm:pr-6">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              list.rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="pl-4 sm:pl-6">
                    <Link href={`/staff/dashboard/${row.id}`} className="font-mono font-semibold hover:underline underline-offset-4">
                      {row.ticket_code}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-56 truncate">{row.client_name}</TableCell>
                  <TableCell className="hidden text-muted-foreground tabular-nums sm:table-cell">{dateTime(row.created_at)}</TableCell>
                  <TableCell className="hidden text-right font-mono tabular-nums md:table-cell">{row.file_count}</TableCell>
                  <TableCell className="pr-4 sm:pr-6">
                    <StatusBadge status={row.status} size="sm" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Pager page={list.page} pageCount={list.pageCount} total={list.total} pageSize={list.pageSize} sizes />
    </div>
  );
}
