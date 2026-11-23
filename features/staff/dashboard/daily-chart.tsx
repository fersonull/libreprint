"use client";

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/shared/components/ui/chart";

export function DailyChart({ daily }: { daily: { label: string; tickets: number }[] }) {
  return (
    <ChartContainer>
      <BarChart
        data={daily}
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
  );
}
