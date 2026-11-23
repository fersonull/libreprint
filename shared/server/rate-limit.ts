// shortcut: in-memory, so limits reset on restart and only work with one server process; move to the DB if the shop ever runs several.
const hits = new Map<string, number[]>();

/** Records one attempt under `key` and reports whether it is over `limit` within `windowMs`. */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 10_000) {
    for (const [k, times] of hits) if (times.every((t) => now - t >= windowMs)) hits.delete(k);
  }
  return recent.length > limit;
}

/** Clears a key, e.g. after a successful sign-in. */
export function resetRateLimit(key: string) {
  hits.delete(key);
}

/**
 * The visitor's IP. Through Cloudflare Tunnel every request arrives from localhost,
 * so the forwarded headers are the only way to tell visitors apart.
 */
export function clientIp(headers: Headers): string {
  return (
    headers.get("cf-connecting-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    headers.get("x-real-ip") ??
    "local"
  );
}
