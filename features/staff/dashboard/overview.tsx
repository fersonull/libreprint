"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { StatusBadge } from "@/components/status-badge";
import { EmptyTray } from "@/components/illustrations";
import type { getOverview, TicketSummary } from "../queries";
import { LiveRefresh } from "../live-refresh";
import { plural, timeAgo, when } from "../format";

type OverviewData = ReturnType<typeof getOverview>;

function Stat({
  label,
  value,
  hint,
  dot,
}: {
  label: string;
  value: number;
  hint: string;
  dot: string;
}) {
  return (
    <div className="flex flex-col gap-1 bg-card px-5 py-4">
      <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <span className={`size-1.5 rounded-full ${dot}`} aria-hidden="true" />
        {label}
      </dt>
      <dd className="font-mono text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </dd>
      <dd className="text-xs text-muted-foreground">{hint}</dd>
    </div>
  );
}

function TicketRow({
  ticket,
  meta,
}: {
  ticket: TicketSummary;
  meta: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={`/staff/dashboard/${ticket.id}`}
        className="flex items-center gap-3 px-6 py-3 transition-colors outline-none hover:bg-muted/50 focus-visible:bg-muted/50"
      >
        <span className="w-20 shrink-0 font-mono text-sm font-semibold">
          {ticket.ticket_code}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">
            {ticket.client_name}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {plural(ticket.file_count, "doc")} ·{" "}
            {plural(ticket.copies, "copy", "copies")}
          </span>
        </span>
        {meta}
      </Link>
    </li>
  );
}

export function Overview({ data }: { data: OverviewData }) {
  const today = new Date().toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground">{today}</p>
        </div>
        <LiveRefresh />
      </header>

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-border ring-1 ring-foreground/10 lg:grid-cols-4">
        <Stat
          label="Waiting"
          value={data.queued}
          hint={`documents across ${plural(data.active_tickets, "ticket")}`}
          dot="bg-amber-500"
        />
        <Stat
          label="Printing now"
          value={data.printing}
          hint="documents on the printer"
          dot="bg-primary"
        />
        <Stat
          label="Finished today"
          value={data.done_today}
          hint={`documents · ${plural(data.copies_today, "copy", "copies")}`}
          dot="bg-emerald-500"
        />
        <Stat
          label="Tickets today"
          value={data.tickets_today}
          hint="submitted since midnight"
          dot="bg-muted-foreground"
        />
      </dl>

      <Card>
        <CardHeader>
          <CardTitle>Tickets per day</CardTitle>
          <CardDescription>Last seven days</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <ChartContainer>
            <BarChart
              data={data.daily}
              accessibilityLayer
              margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
            >
              <CartesianGrid vertical={false} stroke="var(--analytics-grid)" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tickMargin={8}
                tick={{ fill: "currentColor" }}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "currentColor" }}
              />
              <Tooltip
                content={<ChartTooltipContent />}
                cursor={{ fill: "var(--muted)" }}
              />
              {/* no grow-in: the page refreshes every few seconds and it would replay each time */}
              <Bar
                dataKey="tickets"
                name="Tickets"
                fill="var(--analytics-bar)"
                radius={[4, 4, 0, 0]}
                maxBarSize={42}
                isAnimationActive={false}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="gap-0 pb-0">
          <CardHeader className="border-b [.border-b]:pb-4">
            <CardTitle>Up next</CardTitle>
            <CardDescription>
              Printing first, then the longest wait.
            </CardDescription>
            <CardAction>
              <Button asChild variant="ghost" size="sm">
                <Link href="/staff/dashboard/print-desk">
                  Print desk
                  <ArrowRight data-icon="inline-end" aria-hidden="true" />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          {data.upNext.length === 0 ? (
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <EmptyTray className="h-20 w-auto" />
              <p className="text-sm font-medium">Nothing waiting</p>
              <p className="text-xs text-muted-foreground">
                New tickets show up here as soon as a customer submits.
              </p>
            </CardContent>
          ) : (
            <ul className="divide-y">
              {data.upNext.map((ticket) => (
                <TicketRow
                  key={ticket.id}
                  ticket={ticket}
                  meta={
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <StatusBadge status={ticket.status} size="sm" />
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {timeAgo(ticket.created_at)}
                      </span>
                    </span>
                  }
                />
              ))}
            </ul>
          )}
        </Card>

        <Card className="gap-0 pb-0">
          <CardHeader className="border-b [.border-b]:pb-4">
            <CardTitle>Recently finished</CardTitle>
            <CardDescription>
              Ready for the customer to collect.
            </CardDescription>
            <CardAction>
              <Button asChild variant="ghost" size="sm">
                <Link href="/staff/dashboard/transactions?filter=done">
                  All
                  <ArrowRight data-icon="inline-end" aria-hidden="true" />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          {data.recentlyDone.length === 0 ? (
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No finished tickets yet.
            </CardContent>
          ) : (
            <ul className="divide-y">
              {data.recentlyDone.map((ticket) => (
                <TicketRow
                  key={ticket.id}
                  ticket={ticket}
                  meta={
                    <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
                      <CheckCircle2
                        className="size-3.5 text-emerald-600 dark:text-emerald-400"
                        aria-hidden="true"
                      />
                      {ticket.finished_at ? when(ticket.finished_at) : "—"}
                    </span>
                  }
                />
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
