"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Spinner } from "@/shared/components/ui/spinner";
import { FoundStub } from "@/shared/components/illustrations";
import { useI18n } from "@/shared/lib/i18n";
import { codeDigits, useRecentTickets } from "./recent-tickets";

/** "Already submitted a document?": jumps to a ticket by its claim code. */
export function FindTicketForm() {
  const { t } = useI18n();
  const router = useRouter();
  const recent = useRecentTickets();
  const [digits, setDigits] = useState("");
  const [showError, setShowError] = useState(false);
  const [isPending, startTransition] = useTransition();
  // Older tickets have four digits, newer ones six.
  const isValid = digits.length === 4 || digits.length === 6;

  return (
    <section className="mt-10 rounded-xl border border-dashed px-5 py-5 sm:px-6 sm:py-6" aria-labelledby="find-ticket">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <div className="flex min-w-0 items-center gap-4 lg:flex-1">
          <FoundStub className="h-16 w-auto shrink-0 sm:h-20" />
          <div className="flex flex-col gap-1">
            <h2 id="find-ticket" className="text-[15px] font-semibold text-foreground">
              {t("find_ticket_title")}
            </h2>
            <p className="max-w-[40ch] text-sm text-pretty text-muted-foreground">{t("find_ticket_body")}</p>
          </div>
        </div>
        <form
          className="flex w-full flex-col gap-2 sm:flex-row sm:items-start lg:w-auto lg:shrink-0"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (!isValid) return setShowError(true);
            startTransition(() => router.push(`/ticket/PQ-${digits}`));
          }}
        >
          <div className="flex flex-col gap-1.5 sm:flex-1 lg:flex-none">
            <div className="flex h-11 items-center rounded-md border border-input shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:ring-3 has-[[aria-invalid=true]]:ring-destructive/20 sm:h-9 lg:w-60 dark:bg-input/30">
              <span className="pl-3 font-mono text-base tracking-wide text-muted-foreground select-none md:text-sm" aria-hidden="true">
                PQ-
              </span>
              <input
                value={digits}
                onChange={(event) => {
                  setDigits(codeDigits(event.target.value));
                  setShowError(false);
                }}
                placeholder="481920"
                aria-label={t("ticket_code_label")}
                aria-invalid={showError}
                aria-describedby={showError ? "find-ticket-error" : undefined}
                inputMode="numeric"
                autoComplete="off"
                enterKeyHint="go"
                className="h-full w-full min-w-0 bg-transparent pr-3 pl-0.5 font-mono text-base tracking-wide text-foreground outline-none placeholder:text-muted-foreground/60 md:text-sm"
              />
            </div>
            {showError && (
              <p id="find-ticket-error" className="text-[13px] text-destructive" role="alert">
                {t("ticket_code_invalid")}
              </p>
            )}
          </div>
          <Button type="submit" variant="outline" className="h-11 sm:h-9" disabled={isPending}>
            {t("find_ticket_button")}
            {isPending ? <Spinner data-icon="inline-end" /> : <ArrowRight data-icon="inline-end" aria-hidden="true" />}
          </Button>
        </form>
      </div>

      {recent.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-dashed pt-4">
          <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <Clock className="size-3.5" aria-hidden="true" />
            {t("recent_tickets")}
          </span>
          {recent.map((code) => (
            <Link
              key={code}
              href={`/ticket/${code}`}
              className="inline-flex h-11 items-center rounded-lg bg-accent px-3 font-mono text-sm font-semibold tracking-wide text-foreground transition-colors hover:bg-accent/70 sm:h-8"
            >
              {code}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
