import { EventEmitter } from "events";

export interface StatusUpdatePayload {
  ticketId: string;
  fileId: string;
  status: "queued" | "printing" | "done" | "cancelled";
  printedAt?: number | null;
}

const GLOBAL_EMITTER_KEY = Symbol.for("printqueue.emitter");

type GlobalWithEmitter = typeof globalThis & {
  [GLOBAL_EMITTER_KEY]?: EventEmitter;
};

const globalObj = globalThis as GlobalWithEmitter;

if (!globalObj[GLOBAL_EMITTER_KEY]) {
  const newEmitter = new EventEmitter();
  newEmitter.setMaxListeners(500);
  globalObj[GLOBAL_EMITTER_KEY] = newEmitter;
}

export const sseEmitter = globalObj[GLOBAL_EMITTER_KEY]!;

export function emitStatusUpdate(payload: StatusUpdatePayload) {
  sseEmitter.emit("status-update", payload);
  sseEmitter.emit(`ticket:${payload.ticketId}`, payload);
}
