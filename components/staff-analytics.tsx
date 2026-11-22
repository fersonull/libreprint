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
    { label: "Queued", value: stats?.queuedFiles, dot: "bg-amber-500" },
    { label: "Printing", value: stats?.printingFiles, dot: "bg-primary" },
    { label: "Completed", value: stats?.doneFiles, dot: "bg-emerald-600 dark:bg-emerald-400" },
    { label: "Cancelled", value: stats?.cancelledFiles, dot: "bg-rose-500" },
    { label: "Tickets", value: stats?.totalTickets, dot: "bg-zinc-400" },
    { label: "Documents", value: stats?.totalFiles, dot: "bg-zinc-400" },
  ];

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Documents by status, and tickets over the last seven days.</p>
      </header>

      <dl aria-label="Queue totals" className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-border shadow-card sm:grid-cols-3 lg:grid-cols-6">
        {metrics.map(({ label, value, dot }) => (
          <div key={label} className="bg-card px-4 py-3.5">
            <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden="true" />
              {label}
            </dt>
            <dd className="mt-1 font-mono text-2xl font-semibold text-foreground tabular-nums">{value ?? "—"}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="transaction-chart-title" className="rounded-2xl bg-card p-5 shadow-card sm:p-6">
        <h2 id="transaction-chart-title" className="text-[15px] font-semibold text-foreground">Tickets per day</h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">Last seven days</p>
        <div className="mt-5 text-muted-foreground">
          <ChartContainer>
            <BarChart data={daily} accessibilityLayer margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--analytics-grid)" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tickMargin={8} tick={{ fill: "currentColor" }} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "currentColor" }} />
              <Tooltip content={<ChartTooltipContent />} cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="transactions" name="Tickets" fill="var(--analytics-bar)" radius={[4, 4, 0, 0]} maxBarSize={42} />
            </BarChart>
          </ChartContainer>
        </div>
      </section>
    </section>
  );
}
