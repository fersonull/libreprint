"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MissingStub } from "@/shared/components/illustrations";
import { useI18n } from "@/shared/lib/i18n";

export function TicketNotFound({
  code,
  limited = false,
  backHref = "/upload",
  backLabel,
}: {
  code: string;
  /** The visitor looked up too many codes; say so instead of "not found". */
  limited?: boolean;
  backHref?: string;
  backLabel?: string;
}) {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-md py-10 text-center sm:py-16">
      <MissingStub className="mx-auto h-28 w-auto" />
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">{t(limited ? "ticket_limited_title" : "ticket_not_found_title")}</h1>
      <p className="mx-auto mt-2 max-w-[40ch] text-[15px] leading-relaxed text-muted-foreground">
        {limited ? t("ticket_limited_body") : t("ticket_not_found_body").replace("{code}", code)}
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
      className="-ml-2 inline-flex h-11 items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
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
