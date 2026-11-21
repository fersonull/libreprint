"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Ticket, PrintFile } from "@/lib/db";
import { StatusBadge, PrintStatus } from "./status-badge";
import { useI18n } from "@/lib/i18n";
import {
  Printer,
  Search,
  RefreshCw,
  Clock,
  ArrowRight,
  Layers,
  Inbox,
  StickyNote,
} from "lucide-react";
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

  return (
    <div className="space-y-6">
      {/* Top Header / Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {t("desk_title")}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {t("desk_subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchTickets(false)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-zinc-600" : ""}`} />
            <span>{t("refresh")}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <span className="text-[11px] font-medium text-zinc-500 block mb-1">
              {t("queued_kpi")}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                {stats.queuedFiles}
              </span>
              <span className="text-xs text-zinc-400">waiting</span>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <span className="text-[11px] font-medium text-zinc-500 block mb-1">
              {t("printing_kpi")}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                {stats.printingFiles}
              </span>
              <span className="text-xs text-zinc-400">active</span>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <span className="text-[11px] font-medium text-zinc-500 block mb-1">
              {t("completed_kpi")}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {stats.doneFiles}
              </span>
              <span className="text-xs text-zinc-400">finished</span>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <span className="text-[11px] font-medium text-zinc-500 block mb-1">
              {t("total_tickets_kpi")}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                {stats.totalTickets}
              </span>
              <span className="text-xs text-zinc-400">total</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        {/* Filter Tabs */}
        <Tabs value={filterStatus} onValueChange={setFilterStatus}>
          <TabsList aria-label="Filter transactions by status">
            <TabsTrigger value="all">{t("all_tickets_tab")}</TabsTrigger>
            <TabsTrigger value="queued">{t("queued_tab")}</TabsTrigger>
            <TabsTrigger value="printing">{t("printing_tab")}</TabsTrigger>
            <TabsTrigger value="done">{t("completed_tab")}</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("search_placeholder")}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
        <div className="flex gap-2">
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger aria-label="Sort transactions"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="newest">Newest first</SelectItem><SelectItem value="oldest">Oldest first</SelectItem></SelectContent>
          </Select>
          <button type="button" onClick={exportCsv} className="px-3 py-2 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-medium">Export CSV</button>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-zinc-500">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-zinc-400 mb-2" />
            <span>Loading queue...</span>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              No tickets found
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5 max-w-sm mx-auto">
              {searchQuery ? "No tickets match your search." : "Queue is empty."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filteredTickets.map((ticket) => {
              const fileCount = ticket.files.length;
              const hasQueued = ticket.files.some((f) => f.status === "queued");
              const hasPrinting = ticket.files.some((f) => f.status === "printing");
              const allDone = fileCount > 0 && ticket.files.every((f) => f.status === "done");
              const totalCopies = ticket.files.reduce((sum, f) => sum + (f.copies || 1), 0);
              const hasNotes = ticket.files.some((f) => Boolean(f.notes));

              const overallStatus: PrintStatus = hasPrinting
                ? "printing"
                : hasQueued
                ? "queued"
                : allDone
                ? "done"
                : "queued";

              return (
                <div
                  key={ticket.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono font-bold text-base text-zinc-900 dark:text-zinc-100 tracking-tight">
                        {ticket.ticket_code}
                      </span>
                      <StatusBadge status={overallStatus} size="sm" />
                      <span className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {new Date(ticket.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      {hasNotes && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full">
                          <StickyNote className="w-2.5 h-2.5" />
                          Has Notes
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {ticket.client_name}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-zinc-400" />
                        {fileCount} {fileCount === 1 ? "doc" : "docs"} ({totalCopies}{" "}
                        {totalCopies === 1 ? "copy" : "copies"})
                      </span>
                      <span>•</span>
                      <span className="truncate max-w-xs text-zinc-600 dark:text-zinc-300">
                        {ticket.files.map((f) => f.file_name).join(", ")}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <Link
                      href={`/staff/dashboard/${ticket.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>{t("open_and_print")}</span>
                      <ArrowRight className="w-3 h-3 ml-0.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
