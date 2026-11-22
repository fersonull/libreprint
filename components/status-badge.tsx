import React from "react";

export type PrintStatus = "queued" | "printing" | "done" | "cancelled";

interface StatusBadgeProps {
  status: PrintStatus | string;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Overrides the English label, e.g. with a translation. */
  label?: string;
}

export function StatusBadge({ status, size = "md", className = "", label }: StatusBadgeProps) {
  const normStatus = (status || "queued").toLowerCase() as PrintStatus;

  const config = {
    queued: {
      label: "Queued",
      dot: "bg-amber-500 dark:bg-amber-400",
      tone: "bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
      isPulse: false,
    },
    printing: {
      label: "Printing",
      dot: "bg-primary",
      tone: "bg-accent text-foreground",
      isPulse: true,
    },
    done: {
      label: "Done",
      dot: "bg-emerald-600 dark:bg-emerald-400",
      tone: "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200",
      isPulse: false,
    },
    cancelled: {
      label: "Cancelled",
      dot: "bg-rose-500 dark:bg-rose-400",
      tone: "bg-rose-50 text-rose-900 dark:bg-rose-950/50 dark:text-rose-200",
      isPulse: false,
    },
  }[normStatus] || {
    label: normStatus,
    dot: "bg-zinc-400",
    tone: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    isPulse: false,
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1.5",
    md: "px-2.5 py-1 text-xs font-medium gap-1.5",
    lg: "px-3 py-1.5 text-sm font-medium gap-2",
  }[size];

  const dotSize = size === "lg" ? "w-2.5 h-2.5" : "w-2 h-2";

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${config.tone} ${sizeClasses} ${className}`}
    >
      <span
        className={`rounded-full shrink-0 ${config.dot} ${dotSize} ${
          config.isPulse ? "animate-pulse-subtle" : ""
        }`}
        aria-hidden="true"
      />
      <span>{label ?? config.label}</span>
    </span>
  );
}
