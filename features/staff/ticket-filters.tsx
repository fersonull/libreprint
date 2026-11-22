"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Spinner } from "@/shared/components/ui/spinner";

export interface FilterTab {
  value: string;
  label: string;
  count?: number;
}

/**
 * Status tabs, search and sort for a staff list. Everything lives in the URL
 * (?filter, ?q, ?sort), and any change goes back to page 1.
 */
export function TicketFilters({
  tabs,
  filter,
  defaultFilter,
  sorts,
  sort,
  defaultSort,
  searchPlaceholder,
  children,
}: {
  tabs: FilterTab[];
  filter: string;
  defaultFilter: string;
  sorts?: { value: string; label: string }[];
  sort?: string;
  defaultSort?: string;
  searchPlaceholder: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(params.get("q") ?? "");

  const update = (key: string, value: string, fallback = "") => {
    const next = new URLSearchParams(params);
    if (!value || value === fallback) next.delete(key);
    else next.set(key, value);
    next.delete("page");
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  // Debounce typing so the server is not asked for every keystroke.
  useEffect(() => {
    if (query === (params.get("q") ?? "")) return;
    const id = setTimeout(() => update("q", query.trim()), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <Tabs value={filter} onValueChange={(v) => update("filter", v, defaultFilter)}>
        <TabsList aria-label="Filter by status" className="w-full justify-start overflow-x-auto sm:w-fit">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
              {tab.label}
              {tab.count !== undefined && (
                <span className="font-mono text-xs text-muted-foreground tabular-nums">{tab.count}</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="relative block sm:w-72">
          <span className="sr-only">{searchPlaceholder}</span>
          {isPending ? (
            <Spinner className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          ) : (
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          )}
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 pl-9 sm:h-9"
          />
        </label>
        {sorts && sort && (
          <Select value={sort} onValueChange={(v) => update("sort", v, defaultSort)}>
            <SelectTrigger aria-label="Sort" className={cn("h-10 sm:h-9 sm:w-40")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sorts.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {children}
      </div>
    </div>
  );
}
