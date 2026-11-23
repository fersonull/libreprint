import { NextResponse } from "next/server";
import { getDb } from "@/shared/server/db";
import { UUID } from "@/shared/server/tickets";
import { clientIp, isRateLimited } from "@/shared/server/rate-limit";
import { MESSAGES } from "@/shared/i18n/messages";

type Params = { params: Promise<{ id: string }> };

const KEY = /^[A-Za-z0-9_-]{8,200}$/;

/** A browser's PushSubscription, checked before it is stored: these come from the open internet. */
function readSubscription(body: unknown) {
  const b = body as { subscription?: { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } }; lang?: unknown };
  const endpoint = b?.subscription?.endpoint;
  const { p256dh, auth } = b?.subscription?.keys ?? {};
  if (typeof endpoint !== "string" || endpoint.length > 1024 || !endpoint.startsWith("https://")) return null;
  try {
    new URL(endpoint);
  } catch {
    return null;
  }
  if (typeof p256dh !== "string" || !KEY.test(p256dh) || typeof auth !== "string" || !KEY.test(auth)) return null;
  const lang = typeof b.lang === "string" && b.lang in MESSAGES ? b.lang : "en";
  return { endpoint, p256dh, auth, lang };
}

async function guard(request: Request, id: string) {
  if (isRateLimited(`push:${clientIp(request.headers)}`, 30, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many requests. Try again in a few minutes." }, { status: 429 });
  }
  if (!UUID.test(id) || !getDb().prepare("SELECT 1 FROM tickets WHERE id = ?").get(id)) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }
  return null;
}

/** Subscribe this browser to "printing" and "ready" notifications for one ticket. */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const blocked = await guard(request, id);
  if (blocked) return blocked;
  const sub = readSubscription(await request.json().catch(() => null));
  if (!sub) return NextResponse.json({ error: "Invalid subscription." }, { status: 400 });

  getDb()
    .prepare(
      `INSERT INTO push_subscriptions (endpoint, ticket_id, p256dh, auth, lang, created_at) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (endpoint, ticket_id) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth, lang = excluded.lang`
    )
    .run(sub.endpoint, id, sub.p256dh, sub.auth, sub.lang, Date.now());
  return NextResponse.json({ success: true });
}

/** Stop notifications for one ticket on this browser. */
export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;
  const blocked = await guard(request, id);
  if (blocked) return blocked;
  const body = (await request.json().catch(() => null)) as { endpoint?: unknown } | null;
  if (typeof body?.endpoint !== "string") return NextResponse.json({ error: "Missing endpoint." }, { status: 400 });
  getDb().prepare("DELETE FROM push_subscriptions WHERE endpoint = ? AND ticket_id = ?").run(body.endpoint, id);
  return NextResponse.json({ success: true });
}
