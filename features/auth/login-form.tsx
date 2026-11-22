"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CounterBell } from "@/shared/components/illustrations";
import { useI18n } from "@/shared/lib/i18n";
import { Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/staff/dashboard";
  const { t } = useI18n();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!password) {
      setErrorMessage("Please enter the staff access password.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/staff/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Incorrect password.");
      }

      router.push(from);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed.";
      setErrorMessage(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="text-center">
        <CounterBell className="mx-auto h-24 w-auto" />
        <h1 className="mt-5 text-[1.75rem] leading-tight font-semibold tracking-tight text-foreground">
          {t("sign_in_title")}
        </h1>
        <p className="mx-auto mt-2 max-w-[34ch] text-sm leading-relaxed text-muted-foreground">{t("sign_in_subtitle")}</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-7 rounded-2xl bg-card p-5 shadow-card sm:p-6"
      >
        {errorMessage && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2.5 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-900 dark:bg-rose-950/40 dark:text-rose-100"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        <label htmlFor="staffPassword" className="mb-1.5 block text-sm font-semibold text-foreground">
          {t("password_label")}
        </label>
        <div className="relative">
          <input
            id="staffPassword"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
            autoComplete="current-password"
            className="h-12 w-full rounded-xl border border-zinc-300 bg-card px-4 pr-12 text-base text-foreground transition-colors hover:border-zinc-400 focus-visible:border-ring focus:outline-none focus:ring-3 focus-visible:ring-ring/40 dark:border-zinc-700"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-1.5 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading || !password}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[15px] font-semibold text-primary-foreground transition-colors hover:bg-primary/85 active:bg-primary/75 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Verifying…</span>
            </>
          ) : (
            <span>{t("sign_in_btn")}</span>
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-zinc-500">
        Default password: <code className="rounded bg-zinc-200/70 px-1.5 py-0.5 font-mono text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">admin</code>
      </p>
    </div>
  );
}

