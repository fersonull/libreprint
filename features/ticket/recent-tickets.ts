"use client";

import { useMemo, useSyncExternalStore } from "react";

// Per-device convenience only: storage can be blocked or cleared, so every access is guarded.
const KEY = "libreprint_recent_tickets";
const MAX = 3;
const listeners = new Set<() => void>();

function read(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** Remembers a ticket this device opened, newest first. */
export function rememberTicket(code: string) {
  try {
    const codes: string[] = JSON.parse(read() ?? "[]");
    localStorage.setItem(KEY, JSON.stringify([code, ...codes.filter((c) => c !== code)].slice(0, MAX)));
    listeners.forEach((l) => l());
  } catch {
    // Storage unavailable: nothing to remember.
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Codes this device opened recently; empty on the server and when storage is blocked. */
export function useRecentTickets(): string[] {
  const raw = useSyncExternalStore(subscribe, read, () => null);
  return useMemo(() => {
    try {
      const parsed: unknown = JSON.parse(raw ?? "[]");
      return Array.isArray(parsed) ? parsed.filter((c): c is string => typeof c === "string") : [];
    } catch {
      return [];
    }
  }, [raw]);
}

/** "pq 4819", "PQ-481920" or "481920" → digits only, at most six. */
export function codeDigits(input: string) {
  return input.replace(/^\s*pq/i, "").replace(/\D/g, "").slice(0, 6);
}
