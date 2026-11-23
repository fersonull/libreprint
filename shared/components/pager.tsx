"use client";

import { useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from "@/shared/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { useI18n } from "@/shared/lib/i18n";
import { DEFAULT_PAGE_SIZE, PAGE_SIZES, pageWindow } from "@/shared/lib/utils";

/**
 * URL-driven pager: each page is a real link (?page=n), so pages are
 * shareable, back/forward work, and the server only sends one page.
 * `sizes` adds a rows-per-page picker (?size=n).
 */
export function Pager({
  page,
  pageCount,
  total,
  pageSize,
  sizes = false,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  sizes?: boolean;
}) {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const href = (changes: Record<string, number>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      const isDefault = key === "page" ? value === 1 : value === DEFAULT_PAGE_SIZE;
      if (isDefault) next.delete(key);
      else next.set(key, String(value));
    }
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <div className="flex items-center gap-3">
        <p className="text-sm text-muted-foreground tabular-nums">
          {total === 0
            ? t("pager_none")
            : t("pager_range").replace("{from}", String(from)).replace("{to}", String(to)).replace("{total}", String(total))}
        </p>
        {sizes && (
          <Select
            value={String(pageSize)}
            onValueChange={(v) => startTransition(() => router.replace(href({ size: Number(v), page: 1 }), { scroll: false }))}
          >
            <SelectTrigger aria-label={t("pager_rows")} size="sm" className="w-auto gap-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {t("pager_per_page").replace("{n}", String(n))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <Pagination className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <PagerLink href={href({ page: page - 1 })} disabled={page <= 1} label={t("pager_previous")}>
              <ChevronLeft data-icon="inline-start" />
              <span className="hidden sm:inline">{t("pager_previous")}</span>
            </PagerLink>
          </PaginationItem>
          {pageWindow(page, pageCount).map((p, i) =>
            p === "…" ? (
              <PaginationItem key={`gap-${i}`} className="hidden sm:block">
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={p} className={p === page ? "" : "hidden sm:block"}>
                <Button asChild variant={p === page ? "outline" : "ghost"} size="icon">
                  <Link href={href({ page: p })} aria-current={p === page ? "page" : undefined}>
                    {p}
                  </Link>
                </Button>
              </PaginationItem>
            )
          )}
          <PaginationItem>
            <PagerLink href={href({ page: page + 1 })} disabled={page >= pageCount} label={t("pager_next")}>
              <span className="hidden sm:inline">{t("pager_next")}</span>
              <ChevronRight data-icon="inline-end" />
            </PagerLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

function PagerLink({ href, disabled, label, children }: { href: string; disabled: boolean; label: string; children: React.ReactNode }) {
  if (disabled) {
    return (
      <Button variant="ghost" disabled aria-label={label}>
        {children}
      </Button>
    );
  }
  return (
    <Button asChild variant="ghost" aria-label={label}>
      <Link href={href}>{children}</Link>
    </Button>
  );
}
