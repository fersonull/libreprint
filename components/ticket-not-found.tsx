"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MissingStub } from "./illustrations";
import { useI18n } from "@/lib/i18n";

export function TicketNotFound({ code, backHref = "/upload", backLabel }: { code: string; backHref?: string; backLabel?: string }) {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-md py-10 text-center sm:py-16">
      <MissingStub className="mx-auto h-28 w-auto" />
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">{t("ticket_not_found_title")}</h1>
      <p className="mx-auto mt-2 max-w-[40ch] text-[15px] leading-relaxed text-muted-foreground">
        {t("ticket_not_found_body").replace("{code}", code)}
      </p>
      <Link
        href={backHref}
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/85"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {backLabel ?? t("back_to_upload")}
      </Link>
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="-ml-2 inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium text-zinc-500 transition-colors hover:bg-zinc-200/60 hover:text-foreground dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {children}
    </Link>
  );
}

export function SubmitAnotherLink() {
  const { t } = useI18n();
  return <BackLink href="/upload">{t("submit_another")}</BackLink>;
}
