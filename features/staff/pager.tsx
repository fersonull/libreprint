"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from "@/components/ui/pagination";
import { pageWindow } from "./format";

/**
 * URL-driven pager: each page is a real link (?page=n), so pages are
 * shareable, back/forward work, and the server only sends one page.
 */
export function Pager({ page, pageCount, total, pageSize }: { page: number; pageCount: number; total: number; pageSize: number }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const href = (p: number) => {
    const next = new URLSearchParams(params);
    if (p === 1) next.delete("page");
    else next.set("page", String(p));
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-muted-foreground tabular-nums">
        {total === 0 ? "No results" : `${from}–${to} of ${total}`}
      </p>
      {pageCount > 1 && (
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PagerLink href={href(page - 1)} disabled={page <= 1} label="Previous page">
                <ChevronLeft data-icon="inline-start" />
                <span className="hidden sm:inline">Previous</span>
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
                    <Link href={href(p)} aria-current={p === page ? "page" : undefined}>
                      {p}
                    </Link>
                  </Button>
                </PaginationItem>
              )
            )}
            <PaginationItem>
              <PagerLink href={href(page + 1)} disabled={page >= pageCount} label="Next page">
                <span className="hidden sm:inline">Next</span>
                <ChevronRight data-icon="inline-end" />
              </PagerLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
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
      <Link href={href}>
        {children}
      </Link>
    </Button>
  );
}
