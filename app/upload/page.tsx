"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { UploadForm } from "@/components/upload-form";
import { useI18n } from "@/lib/i18n";

export default function UploadPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [ticketCode, setTicketCode] = useState("");

  return (
    <div className="min-h-screen flex flex-col bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Navbar currentPath="/upload" isStaff={false} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:py-12">
        <div className="mb-6 sm:mb-8 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {t("upload_title")}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
            {t("upload_subtitle")}
          </p>
        </div>

        <UploadForm />

        <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t("find_ticket_title")}</h2>
          <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={(event) => {
            event.preventDefault();
            const code = ticketCode.trim();
            if (code) router.push(`/ticket/${encodeURIComponent(code)}`);
          }}>
            <input
              type="text"
              value={ticketCode}
              onChange={(event) => setTicketCode(event.target.value)}
              placeholder={t("ticket_code_placeholder")}
              aria-label={t("ticket_code_label")}
              autoCapitalize="characters"
              autoComplete="off"
              required
              className="h-11 min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-zinc-100"
            />
            <button type="submit" className="h-11 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300">{t("find_ticket_button")}</button>
          </form>
        </section>
      </main>

      <footer className="py-6 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center text-xs text-zinc-400">
        <p>libreprint • Simple local print management</p>
      </footer>
    </div>
  );
}
