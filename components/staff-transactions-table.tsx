"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDownUp, Download, Search } from "lucide-react";
import type { PrintFile, Ticket } from "@/lib/db";
import { StatusBadge, type PrintStatus } from "@/components/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Transaction extends Ticket {
  files: PrintFile[];
}

type StatusFilter = "all" | "queued" | "printing" | "done" | "cancelled";

function transactionStatus(files: PrintFile[]): PrintStatus {
  if (files.some((file) => file.status === "printing")) return "printing";
  if (files.some((file) => file.status === "queued")) return "queued";
  if (files.length && files.every((file) => file.status === "cancelled")) return "cancelled";
  return "done";
}

export function StaffTransactionsTable() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await fetch("/api/staff/tickets");
      if (response.status === 401) return router.push("/staff/login");
      if (response.ok) setTransactions((await response.json()).tickets ?? []);
    } catch (error) {
      console.error("Failed to load transactions:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const initialFetch = setTimeout(fetchTransactions, 0);
    const interval = setInterval(fetchTransactions, 15000);
    return () => { clearTimeout(initialFetch); clearInterval(interval); };
  }, [fetchTransactions]);

  const visibleTransactions = useMemo(() => transactions.filter((transaction) => {
    const matchesQuery = `${transaction.ticket_code} ${transaction.client_name}`.toLowerCase().includes(query.trim().toLowerCase());
    const matchesStatus = status === "all" || transaction.files.some((file) => file.status === status);
    return matchesQuery && matchesStatus;
  }).sort((a, b) => {
    if (sort === "oldest") return a.created_at - b.created_at;
    if (sort === "client") return a.client_name.localeCompare(b.client_name);
    if (sort === "files") return b.files.length - a.files.length;
    return b.created_at - a.created_at;
  }), [transactions, query, status, sort]);

  const exportCsv = () => {
    const escape = (value: unknown) => {
      const text = String(value ?? "");
      return `"${`${/^[=+@\-\t\r]/.test(text) ? "'" : ""}${text}`.replaceAll('"', '""')}"`;
    };
    const rows = [["Ticket", "Client", "Created", "Documents", "Status"], ...visibleTransactions.map((item) => [item.ticket_code, item.client_name, new Date(item.created_at).toISOString(), item.files.map((file) => file.file_name).join("; "), transactionStatus(item.files)])];
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([rows.map((row) => row.map(escape).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
    link.download = "transactions.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };

  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Search, filter, and export submitted print transactions.</p>
      </header>

      <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={status} onValueChange={(value) => setStatus(value as StatusFilter)}>
            <TabsList aria-label="Filter transactions by status" className="h-auto w-full flex-wrap justify-start sm:w-fit">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="queued">Queued</TabsTrigger>
              <TabsTrigger value="printing">Printing</TabsTrigger>
              <TabsTrigger value="done">Completed</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex gap-2">
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger aria-label="Sort transactions"><ArrowDownUp className="size-4" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="client">Client name</SelectItem>
                <SelectItem value="files">Most documents</SelectItem>
              </SelectContent>
            </Select>
            <button type="button" onClick={exportCsv} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-zinc-900 px-3 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"><Download className="size-4" />Export CSV</button>
          </div>
        </div>
        <label className="relative block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ticket or client" className="h-10 w-full rounded-md border border-zinc-300 bg-white pl-9 pr-3 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
        </label>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800"><tr><th className="px-4 py-3 font-medium">Ticket</th><th className="px-4 py-3 font-medium">Client</th><th className="px-4 py-3 font-medium">Submitted</th><th className="px-4 py-3 font-medium">Documents</th><th className="px-4 py-3 font-medium">Status</th></tr></thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {loading ? <tr><td colSpan={5} className="p-8 text-center text-zinc-500">Loading transactions…</td></tr> : visibleTransactions.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-zinc-500">No transactions found.</td></tr> : visibleTransactions.map((transaction) => <tr key={transaction.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"><td className="px-4 py-3 font-mono font-semibold"><Link className="underline-offset-4 hover:underline" href={`/staff/dashboard/${transaction.id}`}>{transaction.ticket_code}</Link></td><td className="px-4 py-3">{transaction.client_name}</td><td className="px-4 py-3 text-zinc-500">{new Date(transaction.created_at).toLocaleString()}</td><td className="px-4 py-3">{transaction.files.length}</td><td className="px-4 py-3"><StatusBadge status={transactionStatus(transaction.files)} size="sm" /></td></tr>)}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-zinc-500">Showing {visibleTransactions.length} of {transactions.length} transactions</p>
    </section>
  );
}
