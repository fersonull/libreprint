"use client";

import { ResponsiveContainer } from "recharts";
import type { ComponentProps, ReactNode } from "react";

export function ChartContainer({ className = "", children, ...props }: ComponentProps<typeof ResponsiveContainer>) {
  return <div className={`h-[280px] w-full text-xs ${className}`}><ResponsiveContainer width="100%" height="100%" {...props}>{children}</ResponsiveContainer></div>;
}

export function ChartTooltipContent({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: number; color?: string }>; label?: ReactNode }) {
  if (!active || !payload?.length) return null;
  return <div className="rounded-lg border bg-popover px-3 py-2 text-popover-foreground shadow-raised"><p className="mb-1 font-medium">{label}</p>{payload.map((item) => <p key={item.name} className="flex items-center gap-2 text-muted-foreground"><span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name}: {item.value}</p>)}</div>;
}
