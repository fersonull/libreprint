"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

type Stats = { totalTickets: number; totalFiles: number; queuedFiles: number; printingFiles: number; doneFiles: number; cancelledFiles: number };
type DailyTransactions = { date: string; label: string; transactions: number }[];

export function StaffAnalytics() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [daily, setDaily] = useState<DailyTransactions>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/staff/tickets").then(async (res) => {
      if (res.status === 401) return router.push("/staff/login");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setDaily(data.daily);
      }
    }).catch((error) => console.error("Failed to load analytics:", error));
  }, [router]);

  const metrics = [
    { label: "Queued Documents", value: stats?.queuedFiles, detail: "waiting", color: "text-amber-600 dark:text-amber-400" },
    { label: "Currently Printing", value: stats?.printingFiles, detail: "active", color: "text-blue-600 dark:text-blue-400" },
    { label: "Completed Prints", value: stats?.doneFiles, detail: "finished", color: "text-emerald-600 dark:text-emerald-400" },
    { label: "Total Tickets", value: stats?.totalTickets, detail: "total", color: "text-zinc-900 dark:text-zinc-100" },
    { label: "Total Documents", value: stats?.totalFiles, detail: "files", color: "text-zinc-900 dark:text-zinc-100" },
    { label: "Cancelled", value: stats?.cancelledFiles, detail: "cancelled", color: "text-rose-600 dark:text-rose-400" },
  ];

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard analytics</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Transaction volume over the last seven days.</p>
      </header>
      <section aria-label="Queue totals" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {metrics.map(({ label, value, detail, color }) => <article key={label} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"><span className="mb-1 block text-[11px] font-medium text-zinc-500">{label}</span><div className="flex items-baseline gap-2"><span className={`text-2xl font-bold tabular-nums ${color}`}>{value ?? "—"}</span><span className="text-xs text-zinc-400">{detail}</span></div></article>)}
      </section>
      <section aria-labelledby="transaction-chart-title" className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 id="transaction-chart-title" className="font-semibold">Daily transactions</h2>
        <p className="mt-1 text-sm text-zinc-500">Tickets submitted per day</p>
        <div className="mt-4">
          <ChartContainer>
            <BarChart data={daily} accessibilityLayer margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--analytics-grid)" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tickMargin={8} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltipContent />} cursor={{ fill: "rgba(113, 113, 122, .08)" }} />
              <Bar dataKey="transactions" name="Transactions" fill="var(--analytics-bar)" radius={[4, 4, 0, 0]} maxBarSize={42} />
            </BarChart>
          </ChartContainer>
        </div>
      </section>
    </section>
  );
}
