"use client";

import { ResponsiveContainer } from "recharts";
import type { ComponentProps, ReactNode } from "react";

export function ChartContainer({ className = "", children, ...props }: ComponentProps<typeof ResponsiveContainer>) {
  return <div className={`h-[280px] w-full text-xs ${className}`}><ResponsiveContainer width="100%" height="100%" {...props}>{children}</ResponsiveContainer></div>;
}

export function ChartTooltipContent({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: number; color?: string }>; label?: ReactNode }) {
  if (!active || !payload?.length) return null;
  return <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 shadow-md dark:border-zinc-800 dark:bg-zinc-950"><p className="mb-1 font-medium">{label}</p>{payload.map((item) => <p key={item.name} className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300"><span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name}: {item.value}</p>)}</div>;
}
