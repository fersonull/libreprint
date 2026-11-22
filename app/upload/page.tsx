"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { UploadForm } from "@/features/upload/upload-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";

export default function UploadPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [ticketCode, setTicketCode] = useState("");

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar currentPath="/upload" isStaff={false} />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-8 pb-12 sm:px-6 sm:pt-12 lg:max-w-6xl">
        <header className="mb-6 flex flex-col gap-2 sm:mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
            {t("upload_title")}
          </h1>
          <p className="max-w-[60ch] text-pretty text-muted-foreground">{t("upload_subtitle")}</p>
        </header>

        <UploadForm />

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
      </main>

      <footer className="py-6 text-center text-xs text-muted-foreground">
        libreprint · {t("brand_tagline")}
      </footer>
    </div>
  );
}
