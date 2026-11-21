import React from "react";

export type PrintStatus = "queued" | "printing" | "done" | "cancelled";

interface StatusBadgeProps {
  status: PrintStatus | string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StatusBadge({ status, size = "md", className = "" }: StatusBadgeProps) {
  const normStatus = (status || "queued").toLowerCase() as PrintStatus;

  const config = {
    queued: {
      label: "Queued",
      dot: "bg-amber-500 dark:bg-amber-400",
      isPulse: false,
    },
    printing: {
      label: "Printing",
      dot: "bg-blue-600 dark:bg-blue-400",
      isPulse: true,
    },
    done: {
      label: "Done",
      dot: "bg-emerald-600 dark:bg-emerald-400",
      isPulse: false,
    },
    cancelled: {
      label: "Cancelled",
      dot: "bg-rose-500 dark:bg-rose-400",
      isPulse: false,
    },
  }[normStatus] || {
    label: normStatus,
    dot: "bg-zinc-400",
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
      className={`inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 ${sizeClasses} ${className}`}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      <span
        className={`rounded-full shrink-0 ${config.dot} ${dotSize} ${
          config.isPulse ? "animate-pulse-subtle" : ""
        }`}
        aria-hidden="true"
      />
      <span>{config.label}</span>
    </span>
  );
}
