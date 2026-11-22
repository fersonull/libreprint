"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Re-renders the current Server Component page on an interval so queues stay
 * live. router.refresh keeps client state (search text, scroll) intact.
 */
export function LiveRefresh({ seconds = 5 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground" title={`Updates every ${seconds}s`}>
      <span className="relative flex size-2" aria-hidden="true">
        <span className="absolute inline-flex size-full rounded-full bg-emerald-500 opacity-60 animate-pulse-subtle" />
        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
      </span>
      Live
    </span>
  );
}
