"use client";

import type { ReactNode } from "react";
import { Navbar } from "@/shared/components/navbar";
import { useI18n } from "@/shared/lib/i18n";
import { UploadForm } from "./upload-form";

/** `after` renders under the form; the route fills it (e.g. the ticket lookup) so upload stays independent. */
export function UploadPage({ after }: { after?: ReactNode }) {
  const { t } = useI18n();

  return (
    // pb-24 on phones keeps the page's end clear of the form's fixed submit bar
    <div className="flex min-h-screen flex-col pb-24 lg:pb-0">
      <Navbar currentPath="/upload" isStaff={false} />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-8 pb-12 sm:px-6 sm:pt-12 lg:max-w-6xl">
        <header className="mb-6 flex flex-col gap-2 sm:mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
            {t("upload_title")}
          </h1>
          <p className="max-w-[60ch] text-pretty text-muted-foreground">{t("upload_subtitle")}</p>
        </header>

        <UploadForm />
        {after}
      </main>

      <footer className="py-6 text-center text-xs text-muted-foreground">
        libreprint · {t("brand_tagline")}
      </footer>
    </div>
  );
}
