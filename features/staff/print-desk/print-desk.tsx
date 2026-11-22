"use client";

import Link from "next/link";
import { ArrowRight, Palette, StickyNote } from "lucide-react";
import { useI18n } from "@/shared/lib/i18n";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card } from "@/shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { StatusBadge, type PrintStatus } from "@/shared/components/status-badge";
import { EmptyTray } from "@/shared/components/illustrations";
import type { TicketSummary } from "../queries";
import { LiveRefresh } from "../live-refresh";
import { Pager } from "../pager";
import { TicketFilters } from "../ticket-filters";
import { clockTime, plural, timeAgo } from "../format";

interface DeskProps {
  list: { rows: TicketSummary[]; total: number; page: number; pageCount: number; pageSize: number };
  counts: Record<PrintStatus, number>;
  filter: string;
  sort: string;
}

export function PrintDesk({ list, counts, filter, sort }: DeskProps) {
  const { t } = useI18n();
  const tabs = [
    { value: "active", label: "To print", count: counts.queued + counts.printing },
    { value: "queued", label: t("queued_tab"), count: counts.queued },
    { value: "printing", label: t("printing_tab"), count: counts.printing },
    { value: "done", label: t("completed_tab"), count: counts.done },
    { value: "all", label: "All" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Print desk</h1>
          <p className="text-sm text-muted-foreground">Tickets waiting at the counter. Open one to preview and print it.</p>
        </div>
        <LiveRefresh />
      </header>

      <TicketFilters
        tabs={tabs}
        filter={filter}
        defaultFilter="active"
        sorts={[
          { value: "oldest", label: "Oldest first" },
          { value: "newest", label: "Newest first" },
        ]}
        sort={sort}
        defaultSort="oldest"
        searchPlaceholder={t("search_placeholder")}
      />

      <Card className="gap-0 py-0">
        {list.rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
            <EmptyTray className="mb-2 h-24 w-auto" />
            <h2 className="font-medium">{filter === "active" ? t("empty_queue_title") : t("no_search_results")}</h2>
            {filter === "active" && <p className="max-w-sm text-sm text-muted-foreground">{t("empty_queue_body")}</p>}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4 sm:pl-6">Ticket</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Documents</TableHead>
                <TableHead className="hidden sm:table-cell">Waiting</TableHead>
                <TableHead className="hidden lg:table-cell">Status</TableHead>
                <TableHead className="pr-4 text-right sm:pr-6">
                  <span className="sr-only">Action</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.rows.map((row) => {
                const href = `/staff/dashboard/${row.id}`;
                const waiting = row.status === "queued" || row.status === "printing";
                return (
                  <TableRow key={row.id} className="group">
                    <TableCell className="pl-4 sm:pl-6">
                      <Link href={href} className="font-mono text-[15px] font-semibold tracking-tight hover:underline underline-offset-4">
                        {row.ticket_code}
                      </Link>
                      <div className="mt-1 lg:hidden">
                        <StatusBadge status={row.status} size="sm" />
                      </div>
                    </TableCell>
                    <TableCell className="max-w-56">
                      <p className="truncate font-medium">{row.client_name}</p>
                      <p className="truncate text-xs text-muted-foreground md:hidden">
                        {plural(row.file_count, "doc")} · {plural(row.copies, "copy", "copies")}
                      </p>
                    </TableCell>
                    <TableCell className="hidden max-w-72 md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">
                          {plural(row.file_count, "doc")} · {plural(row.copies, "copy", "copies")}
                        </span>
                        {row.color_files > 0 && (
                          <Badge variant="outline" className="gap-1">
                            <Palette aria-hidden="true" />
                            Color
                          </Badge>
                        )}
                        {row.has_notes > 0 && (
                          <Badge variant="outline" className="gap-1 border-amber-300 text-amber-800 dark:border-amber-800 dark:text-amber-200">
                            <StickyNote aria-hidden="true" />
                            Note
                          </Badge>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground" title={row.file_names}>
                        {row.file_names}
                      </p>
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap sm:table-cell">
                      <p className={cn("text-sm tabular-nums", waiting && "font-medium")}>
                        {waiting ? timeAgo(row.created_at) : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums">{clockTime(row.created_at)}</p>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <StatusBadge status={row.status} size="sm" />
                    </TableCell>
                    <TableCell className="pr-4 text-right sm:pr-6">
                      <Button asChild size="sm" variant={row.status === "queued" ? "default" : "outline"}>
                        <Link href={href}>
                          {row.status === "queued" ? "Print" : "Open"}
                          <ArrowRight data-icon="inline-end" aria-hidden="true" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <Pager page={list.page} pageCount={list.pageCount} total={list.total} pageSize={list.pageSize} />
    </div>
  );
}
