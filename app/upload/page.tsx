"use client";

import { Navbar } from "@/components/navbar";
import { UploadForm } from "@/components/upload-form";
import { useI18n } from "@/lib/i18n";

export default function UploadPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen flex flex-col bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Navbar currentPath="/upload" />

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
      </main>

      <footer className="py-6 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center text-xs text-zinc-400">
        <p>libreprint • Simple local print management</p>
      </footer>
    </div>
  );
}
