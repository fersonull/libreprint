"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

/**
 * Single-choice segmented control: the preset's joined outline ToggleGroup,
 * stretched so every option gets the same width. Labels never wrap, and items
 * are 44px tall on touch screens.
 */
export function SegmentedToggle<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: SegmentOption<T>[];
  label: string;
  className?: string;
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      spacing={0}
      value={value}
      // Radix sends "" when the active item is clicked again; keep a choice.
      onValueChange={(next) => next && onChange(next as T)}
      aria-label={label}
      className={cn("grid w-full", className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map(({ value: v, label: l, icon: Icon }) => (
        <ToggleGroupItem
          key={v}
          value={v}
          className="h-11 min-w-0 px-1! text-[13px] whitespace-nowrap text-muted-foreground sm:px-2! sm:text-sm data-[state=on]:font-medium data-[state=on]:text-foreground sm:h-9"
        >
          {Icon && <Icon data-icon="inline-start" aria-hidden="true" />}
          <span className="truncate">{l}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
