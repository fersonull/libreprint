"use client";

import { StatusBadge, type PrintStatus } from "@/shared/components/status-badge";
import { LiveRefresh } from "@/shared/components/live-refresh";
import { Pager } from "@/shared/components/pager";
import { useI18n } from "@/shared/lib/i18n";

/** One masked ticket on the public board. */
export type PublicQueueEntry = { code: string; status: PrintStatus };

type Paging = { total: number; page: number; pageCount: number; pageSize: number };

export function QueueBoard({ waiting, ready, paging }: { waiting: PublicQueueEntry[]; ready: PublicQueueEntry[]; paging: Paging }) {
  const offset = (paging.page - 1) * paging.pageSize;
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{t("queue_title")}</h1>
          <LiveRefresh />
        </div>
        <p className="max-w-[60ch] text-pretty text-muted-foreground">{t("queue_subtitle")}</p>
      </header>

      <section aria-labelledby="ready-heading">
        <h2 id="ready-heading" className="mb-3 text-sm font-semibold text-foreground">
          {t("stage_done")} <span className="font-normal text-muted-foreground">· {ready.length}</span>
        </h2>
        {ready.length === 0 ? (
          <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            {t("queue_none_ready")}
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ready.map((e, i) => (
              <li
                key={i}
                className="rounded-xl bg-emerald-50 px-4 py-3 text-center font-mono text-xl font-semibold tracking-wide text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"
              >
                {e.code}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="waiting-heading">
        <h2 id="waiting-heading" className="mb-3 text-sm font-semibold text-foreground">
          {t("queue_in_line")} <span className="font-normal text-muted-foreground">· {paging.total}</span>
        </h2>
        {waiting.length === 0 ? (
          <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            {t("queue_none_waiting")}
          </p>
        ) : (
          <ol className="divide-y rounded-xl border bg-card">
            {waiting.map((e, i) => (
              <li key={i} className="flex items-center gap-4 px-4 py-3">
                <span className="w-6 text-right text-sm tabular-nums text-muted-foreground">{offset + i + 1}</span>
                <span className="flex-1 font-mono text-lg font-semibold tracking-wide text-foreground">{e.code}</span>
                <StatusBadge status={e.status} label={t(`status_${e.status}`)} />
              </li>
            ))}
          </ol>
        )}
        {paging.pageCount > 1 && (
          <div className="mt-3">
            <Pager {...paging} />
          </div>
        )}
      </section>

      <p className="text-xs text-muted-foreground">{t("queue_masked_note")}</p>
    </div>
  );
}
