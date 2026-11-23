import { sseEmitter, StatusUpdatePayload } from "@/shared/server/live-updates";
import { getDb, Ticket } from "@/shared/server/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  // By id only: resolving codes here would let anyone turn a guessed code into a ticket id without hitting the lookup limit.
  const ticket = db.prepare("SELECT id FROM tickets WHERE id = ?").get(id) as Ticket | undefined;
  if (!ticket) return new Response("Ticket not found.", { status: 404 });
  const targetTicketId = ticket.id;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Controller might already be closed
        }
      };

      // Send initial connection handshake
      send({
        type: "connected",
        ticketId: targetTicketId,
        timestamp: Date.now(),
      });

      // Heartbeat ping every 15s to keep connections alive across networks and tunnels
      const heartbeat = setInterval(() => {
        send({ type: "ping", timestamp: Date.now() });
      }, 15000);

      const statusListener = (payload: StatusUpdatePayload) => {
        if (payload.ticketId === targetTicketId) {
          send({
            type: "status-update",
            ...payload,
            timestamp: Date.now(),
          });
        }
      };

      sseEmitter.on("status-update", statusListener);

      const cleanup = () => {
        clearInterval(heartbeat);
        sseEmitter.off("status-update", statusListener);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      };

      request.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
