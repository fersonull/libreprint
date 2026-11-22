"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useI18n } from "@/shared/lib/i18n";

/** "Already submitted a document?": jumps to a ticket by its claim code. */
export function FindTicketForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [ticketCode, setTicketCode] = useState("");

  return (
    <section
      className="mt-8 flex flex-col gap-3 rounded-xl border border-dashed px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
      aria-labelledby="find-ticket"
    >
      <h2 id="find-ticket" className="text-sm font-medium text-foreground">
        {t("find_ticket_title")}
      </h2>
      <form
        className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          const code = ticketCode.trim();
          if (code) router.push(`/ticket/${encodeURIComponent(code)}`);
        }}
      >
        <Input
          value={ticketCode}
          onChange={(event) => setTicketCode(event.target.value)}
          placeholder={t("ticket_code_placeholder")}
          aria-label={t("ticket_code_label")}
          autoCapitalize="characters"
          autoComplete="off"
          required
          className="h-11 font-mono tracking-wide uppercase placeholder:font-sans placeholder:tracking-normal placeholder:normal-case sm:h-9 sm:w-72"
        />
        <Button type="submit" variant="outline" className="h-11 sm:h-9">
          {t("find_ticket_button")}
          <ArrowRight data-icon="inline-end" aria-hidden="true" />
        </Button>
      </form>
    </section>
  );
}
