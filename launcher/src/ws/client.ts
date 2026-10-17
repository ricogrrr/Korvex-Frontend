/* WsClient seam - matches ServerboundWebSocketMessage{request_id,service,method,input}.
   Swap MockWsClient for the real protobuf implementation later; services never see it. */

import { decodeEnvelope, encodeEnvelope } from './envelope';

export interface PushMessage {
  service: string;
  method: string;
  /** Serialized output bytes - mock delivers the object itself for convenience. */
  input: unknown;
}

export type PushHandler = (msg: PushMessage) => void;

export interface WsClient {
  /** Fire an RPC; resolves with the method's output payload. */
  call<TReq = unknown, TRes = unknown>(service: string, method: string, input: TReq): Promise<TRes>;
  /** Subscribe to server push messages (cosmetic pushes, presence, invites). */
  onPush(handler: PushHandler): () => void;
  close(): void;
}

type MethodHandler = (input: unknown) => unknown | Promise<unknown>;

interface PendingCall {
  resolve: (v: unknown) => void;
  reject: (e: unknown) => void;
}

/**
 * In-memory backend. Handlers are registered per service.method and get
 * fixtures from services/. Latency simulates the websocket round-trip.
 */
export class MockWsClient implements WsClient {
  private handlers = new Map<string, MethodHandler>();
  private pushes = new Set<PushHandler>();
  private pending = new Map<string, PendingCall>();
  private seq = 0;
  private closed = false;

  constructor(private latency: () => number = () => 60 + Math.random() * 140) {}

  /** Register a mock service method. Used by the fixture layer. */
  register(service: string, method: string, handler: MethodHandler): void {
    this.handlers.set(`${service}.${method}`, handler);
  }

  /** Server → client push. Call from fixtures to simulate live events. */
  emit(service: string, method: string, input: unknown): void {
    if (this.closed) return;
    const msg: PushMessage = { service, method, input };
    for (const h of this.pushes) h(msg);
  }

  call<TReq, TRes>(service: string, method: string, input: TReq): Promise<TRes> {
    if (this.closed) return Promise.reject(new Error('ws closed'));
    const requestId = String(++this.seq); // real impl sends this as UTF-8 bytes
    const key = `${service}.${method}`;
    const handler = this.handlers.get(key);
    return new Promise<TRes>((resolve, reject) => {
      this.pending.set(requestId, { resolve: resolve as PendingCall['resolve'], reject });
      setTimeout(() => {
        this.pending.delete(requestId);
        if (!handler) {
          reject(new Error(`no handler for ${key}`));
          return;
        }
        try {
          resolve(handler(input) as TRes);
        } catch (e) {
          reject(e);
        }
      }, this.latency());
    });
  }

  onPush(handler: PushHandler): () => void {
    this.pushes.add(handler);
    return () => this.pushes.delete(handler);
  }

  close(): void {
    this.closed = true;
    for (const [, p] of this.pending) p.reject(new Error('ws closed'));
    this.pending.clear();
    this.pushes.clear();
  }
}

interface PendingEntry extends PendingCall {
  timer: ReturnType<typeof setTimeout>;
}

interface RealWsClientOptions {
  /** Per-call deadline. Default 10s. */
  timeoutMs?: number;
  /** Reconnect with exponential backoff. Default true. */
  reconnect?: boolean;
  /** Max buffered messages while disconnected. Default 100. */
  maxQueue?: number;
}

/**
 * Real transport: outbound frames are protobuf envelopes (see envelope.ts) -
 * the server negotiates per connection and replies in the same format.
 * Inbound accepts both proto and legacy JSON so a mixed-format server still
 * works. Responses match pending calls by request_id; anything with
 * service+method and no pending id is a push.
 */
export class RealWsClient implements WsClient {
  private ws?: WebSocket;
  private pending = new Map<string, PendingEntry>();
  private pushes = new Set<PushHandler>();
  private queue: Uint8Array[] = [];
  private seq = 0;
  private closed = false;
  private attempts = 0;
  private retryTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private url: string,
    private opts: RealWsClientOptions = {},
  ) {
    this.connect();
  }

  private connect(): void {
    const ws = new WebSocket(this.url);
    ws.binaryType = 'arraybuffer';
    this.ws = ws;
    ws.onopen = () => {
      this.attempts = 0;
      const out = this.queue;
      this.queue = [];
      for (const frame of out) ws.send(frame);
    };
    ws.onmessage = (e) => this.onMessage(e.data);
    ws.onclose = () => {
      if (this.closed) return;
      if (this.opts.reconnect === false) {
        this.failAll(new Error('ws disconnected'));
        return;
      }
      const delay = Math.min(1000 * 2 ** this.attempts++, 15000);
      this.retryTimer = setTimeout(() => this.connect(), delay);
    };
    ws.onerror = () => {
      /* onclose follows; nothing to do */
    };
  }

  private onMessage(raw: unknown): void {
    let msg: { request_id?: string; service?: string; method?: string; output?: unknown; input?: unknown; error?: string } | null;
    if (typeof raw === 'string') {
      /* Legacy JSON frame - server stays dual-format during transition. */
      try {
        msg = JSON.parse(raw) as typeof msg;
      } catch {
        return;
      }
    } else if (raw instanceof ArrayBuffer) {
      msg = decodeEnvelope(new Uint8Array(raw));
    } else {
      return;
    }
    if (!msg) return;
    const p = msg.request_id ? this.pending.get(msg.request_id) : undefined;
    if (p) {
      this.pending.delete(msg.request_id!);
      clearTimeout(p.timer);
      if (msg.error) p.reject(new Error(msg.error));
      else p.resolve(msg.output ?? msg.input);
      return;
    }
    if (msg.service && msg.method) {
      const push: PushMessage = { service: msg.service, method: msg.method, input: msg.input };
      for (const h of this.pushes) h(push);
    }
  }

  private failAll(e: Error): void {
    for (const [, p] of this.pending) {
      clearTimeout(p.timer);
      p.reject(e);
    }
    this.pending.clear();
  }

  call<TReq, TRes>(service: string, method: string, input: TReq): Promise<TRes> {
    if (this.closed) return Promise.reject(new Error('ws closed'));
    const requestId = String(++this.seq);
    const frame = encodeEnvelope({ request_id: requestId, service, method, input });
    return new Promise<TRes>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error(`timeout waiting for ${service}.${method}`));
      }, this.opts.timeoutMs ?? 10000);
      this.pending.set(requestId, { resolve: resolve as PendingCall['resolve'], reject, timer });
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(frame);
      } else {
        this.queue.push(frame);
        const cap = this.opts.maxQueue ?? 100;
        if (this.queue.length > cap) {
          this.queue.splice(0, this.queue.length - cap);
        }
      }
    });
  }

  onPush(handler: PushHandler): () => void {
    this.pushes.add(handler);
    return () => this.pushes.delete(handler);
  }

  close(): void {
    this.closed = true;
    clearTimeout(this.retryTimer);
    this.failAll(new Error('ws closed'));
    this.ws?.close();
    this.pushes.clear();
  }
}

/**
 * The one seam. A real endpoint is opt-in via VITE_WS_URL; otherwise the
 * launcher runs on the fixture backend. Proto encoding replaces the JSON
 * frame format inside RealWsClient when the backend lands.
 */
const WS_URL = (import.meta.env?.VITE_WS_URL as string | undefined) ?? undefined;
const WS_TOKEN = (import.meta.env?.VITE_WS_TOKEN as string | undefined) ?? '';

/* Server-issued token persists from Microsoft login; env is a dev fallback. */
export const AUTH_TOKEN_KEY = 'korvex.auth.token';
const storedToken = (() => {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) ?? '';
  } catch {
    return '';
  }
})();
const token = storedToken || WS_TOKEN;
const wsUrl = WS_URL && token
  ? `${WS_URL}${WS_URL.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`
  : WS_URL;
export const wsClient: WsClient = wsUrl ? new RealWsClient(wsUrl) : new MockWsClient();
