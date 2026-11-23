"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Spinner } from "@/shared/components/ui/spinner";
import { useI18n } from "@/shared/lib/i18n";
import { primeAlertSound } from "./progress-alert";

type Env = "server" | "insecure" | "unsupported" | "ios-install" | "denied" | "ready";

/** What this browser can do, worked out once on the client. */
function detectEnv(): Env {
  if (!window.isSecureContext) return "insecure";
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const installed = window.matchMedia("(display-mode: standalone)").matches;
  if (ios && !installed) return "ios-install";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  return "ready";
}

const noSubscribe = () => () => {};
const storageKey = (ticketId: string) => `libreprint_notify_${ticketId}`;

function remembered(ticketId: string) {
  try {
    return localStorage.getItem(storageKey(ticketId));
  } catch {
    return null;
  }
}

function remember(ticketId: string, endpoint: string | null) {
  try {
    if (endpoint) localStorage.setItem(storageKey(ticketId), endpoint);
    else localStorage.removeItem(storageKey(ticketId));
  } catch {
    // Storage blocked: the button just won't remember it was on.
  }
}

function keyBytes(base64url: string) {
  const base64 = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

async function currentSubscription() {
  const reg = await navigator.serviceWorker.getRegistration("/");
  return (await reg?.pushManager.getSubscription()) ?? null;
}

/** "Notify me" for one ticket: push when it starts printing and when it's ready. */
export function NotifyMe({ ticketId, vapidPublicKey }: { ticketId: string; vapidPublicKey: string }) {
  const { t, lang } = useI18n();
  const env = useSyncExternalStore(noSubscribe, detectEnv, () => "server" as const);
  const [on, setOn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (env !== "ready") return;
    let alive = true;
    currentSubscription()
      .then((sub) => alive && setOn(!!sub && sub.endpoint === remembered(ticketId)))
      .catch(() => alive && setOn(false));
    return () => {
      alive = false;
    };
  }, [env, ticketId]);

  const turnOn = async () => {
    primeAlertSound();
    setBusy(true);
    setFailed(false);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setDenied(permission === "denied");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const options = { userVisibleOnly: true, applicationServerKey: keyBytes(vapidPublicKey) };
      let sub = await reg.pushManager.getSubscription();
      try {
        sub ??= await reg.pushManager.subscribe(options);
      } catch {
        // A subscription made with an old server key: replace it.
        await sub?.unsubscribe();
        sub = await reg.pushManager.subscribe(options);
      }
      const res = await fetch(`/api/tickets/${ticketId}/push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON(), lang }),
      });
      if (!res.ok) throw new Error(`subscribe failed: ${res.status}`);
      remember(ticketId, sub.endpoint);
      setOn(true);
    } catch (err) {
      console.error(err);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async () => {
    setBusy(true);
    try {
      const sub = await currentSubscription();
      if (sub) {
        await fetch(`/api/tickets/${ticketId}/push`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
      }
      remember(ticketId, null);
      setOn(false);
    } finally {
      setBusy(false);
    }
  };

  if (env === "server") return null;

  const hint = (text: string) => (
    <p className="flex items-start gap-2 text-[13px] leading-relaxed text-muted-foreground">
      <BellOff className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {text}
    </p>
  );

  if (env === "insecure") return hint(t("notify_https_hint"));
  if (env === "ios-install") return hint(t("notify_ios_hint"));
  if (env === "unsupported") return hint(t("notify_unsupported"));
  if (env === "denied" || denied) return hint(t("notify_denied"));

  if (on) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[13px] font-medium text-foreground">
          <BellRing className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          {t("notify_on")}
        </p>
        <Button variant="ghost" size="sm" className="h-11 text-muted-foreground sm:h-8" onClick={turnOff} disabled={busy}>
          {t("notify_off")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button variant="outline" className="h-11 w-full sm:w-auto sm:self-start" onClick={turnOn} disabled={busy || on === null}>
        {busy ? <Spinner data-icon="inline-start" /> : <Bell data-icon="inline-start" aria-hidden="true" />}
        {t("notify_button")}
      </Button>
      <p className="text-[13px] text-muted-foreground" role={failed ? "alert" : undefined}>
        {failed ? t("notify_failed") : t("notify_explainer")}
      </p>
    </div>
  );
}
