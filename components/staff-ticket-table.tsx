"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Ticket, PrintFile } from "@/lib/db";
import { StatusBadge, PrintStatus } from "./status-badge";
import { useI18n } from "@/lib/i18n";
import { Printer, Search, RefreshCw, ArrowRight, StickyNote, Download } from "lucide-react";
import { EmptyTray } from "./illustrations";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TicketWithFiles extends Ticket {
  files: PrintFile[];
}

interface Stats {
  totalTickets: number;
  totalFiles: number;
  queuedFiles: number;
  printingFiles: number;
  doneFiles: number;
  cancelledFiles: number;
}

export function StaffTicketTable() {
  const router = useRouter();
  const { t } = useI18n();
  const [tickets, setTickets] = useState<TicketWithFiles[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  const fetchTickets = useCallback(async (quiet = false) => {
    try {
      if (!quiet) setIsRefreshing(true);
      const res = await fetch("/api/staff/tickets");
      if (res.status === 401) {
        router.push("/staff/login");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error("Failed to load staff tickets:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    const initialFetch = setTimeout(() => fetchTickets(), 0);
    const interval = setInterval(() => {
      fetchTickets(true);
    }, 5000);
    return () => {
      clearTimeout(initialFetch);
      clearInterval(interval);
    };
  }, [fetchTickets]);

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      ticket.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticket_code.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === "all") return true;
    if (filterStatus === "queued") {
      return ticket.files.some((f) => f.status === "queued");
    }
    if (filterStatus === "printing") {
      return ticket.files.some((f) => f.status === "printing");
    }
    if (filterStatus === "done") {
      return ticket.files.every((f) => f.status === "done");
    }
    return true;
  }).sort((a, b) => sortOrder === "oldest" ? a.created_at - b.created_at : b.created_at - a.created_at);

  const exportCsv = () => {
    const escape = (value: unknown) => {
      const text = String(value ?? "");
      return `"${`${/^[=+@\-\t\r]/.test(text) ? "'" : ""}${text}`.replaceAll('"', '""')}"`;
    };
    const rows = [["Ticket", "Client", "Created", "Files", "Status"], ...filteredTickets.map((ticket) => [ticket.ticket_code, ticket.client_name, new Date(ticket.created_at).toISOString(), ticket.files.map((file) => file.file_name).join("; "), ticket.files.map((file) => file.status).join("; ")])];
    const csv = rows.map((row) => row.map(escape).join(",")).join("\r\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.download = "print-transactions.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };

  const tally = stats
    ? [
        { label: t("queued_kpi"), value: stats.queuedFiles, dot: "bg-amber-500" },
        { label: t("printing_kpi"), value: stats.printingFiles, dot: "bg-primary" },
        { label: t("completed_kpi"), value: stats.doneFiles, dot: "bg-emerald-600 dark:bg-emerald-400" },
        { label: t("total_tickets_kpi"), value: stats.totalTickets, dot: "bg-zinc-400" },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight text-foreground">{t("desk_title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("desk_subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => fetchTickets(false)}
          disabled={isRefreshing}
          className="inline-flex h-9 items-center gap-1.5 self-start rounded-lg border border-zinc-300 bg-card px-3 text-[13px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50 sm:self-auto dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden="true" />
          {t("refresh")}
        </button>
      </div>

      {stats && (
        <dl className="grid grid-cols-2 overflow-hidden rounded-2xl bg-card shadow-card sm:grid-cols-4">
          {tally.map(({ label, value, dot }, i) => (
            <div
              key={label}
              className={`px-4 py-3.5 sm:px-5 ${i % 2 ? "border-l" : ""} ${i > 1 ? "border-t sm:border-t-0" : ""} ${i === 2 ? "sm:border-l" : ""} border-border`}
            >
              <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden="true" />
                {label}
              </dt>
              <dd className="mt-1 font-mono text-2xl font-semibold text-foreground tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="overflow-hidden rounded-2xl bg-card shadow-card">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-zinc-100 p-3 lg:flex-row lg:items-center lg:justify-between dark:border-zinc-800">
          <Tabs value={filterStatus} onValueChange={setFilterStatus}>
            <TabsList aria-label="Filter tickets by status" className="w-full justify-start overflow-x-auto sm:w-fit">
              <TabsTrigger value="all">{t("all_tickets_tab")}</TabsTrigger>
              <TabsTrigger value="queued">{t("queued_tab")}</TabsTrigger>
              <TabsTrigger value="printing">{t("printing_tab")}</TabsTrigger>
              <TabsTrigger value="done">{t("completed_tab")}</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="relative block sm:w-64">
              <span className="sr-only">{t("search_placeholder")}</span>
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("search_placeholder")}
                className="h-10 w-full rounded-lg border border-zinc-300 bg-card pr-3 pl-9 text-sm text-foreground placeholder:text-zinc-400 hover:border-zinc-400 focus-visible:border-ring focus:outline-none focus:ring-3 focus-visible:ring-ring/40 dark:border-zinc-700"
              />
            </label>
            <div className="flex gap-2">
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger aria-label="Sort tickets" className="flex-1 sm:flex-none"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                </SelectContent>
              </Select>
              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-zinc-300 bg-card px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                CSV
              </button>
            </div>
          </div>
        </div>

        {/* Queue */}
        {isLoading ? (
          <div className="p-12 text-center text-sm text-zinc-500">
            <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin text-zinc-400" aria-hidden="true" />
            Loading queue…
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <EmptyTray className="mx-auto h-24 w-auto" />
            <h2 className="mt-4 text-[15px] font-semibold text-foreground">
              {searchQuery ? t("no_search_results") : t("empty_queue_title")}
            </h2>
            {!searchQuery && <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{t("empty_queue_body")}</p>}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filteredTickets.map((ticket) => {
              const fileCount = ticket.files.length;
              const hasQueued = ticket.files.some((f) => f.status === "queued");
              const hasPrinting = ticket.files.some((f) => f.status === "printing");
              const allDone = fileCount > 0 && ticket.files.every((f) => f.status === "done");
              const totalCopies = ticket.files.reduce((sum, f) => sum + (f.copies || 1), 0);
              const hasNotes = ticket.files.some((f) => Boolean(f.notes));

              const overallStatus: PrintStatus = hasPrinting ? "printing" : hasQueued ? "queued" : allDone ? "done" : "queued";

              return (
                <li
                  key={ticket.id}
                  className="group flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-zinc-50/80 sm:flex-row sm:items-center sm:gap-5 sm:px-5 dark:hover:bg-zinc-800/40"
                >
                  <div className="flex items-center gap-3 sm:w-44 sm:shrink-0 sm:flex-col sm:items-start sm:gap-1.5">
                    <span className="font-mono text-[17px] font-bold tracking-tight text-foreground">{ticket.ticket_code}</span>
                    <StatusBadge status={overallStatus} size="sm" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[15px] font-semibold text-foreground">{ticket.client_name}</p>
                      {hasNotes && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                          <StickyNote className="h-3 w-3" aria-hidden="true" />
                          Notes
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                      <span className="font-mono tabular-nums">
                        {new Date(ticket.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {" · "}
                      {fileCount} {fileCount === 1 ? "doc" : "docs"}, {totalCopies} {totalCopies === 1 ? "copy" : "copies"}
                      {" · "}
                      <span className="text-zinc-600 dark:text-zinc-300">{ticket.files.map((f) => f.file_name).join(", ")}</span>
                    </p>
                  </div>

                  <Link
                    href={`/staff/dashboard/${ticket.id}`}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-zinc-300 bg-card px-4 text-[13px] font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground dark:border-zinc-700 dark:hover:text-primary-foreground"
                  >
                    <Printer className="h-4 w-4" aria-hidden="true" />
                    {t("open_and_print")}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
