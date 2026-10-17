import { afterEach, describe, expect, it, vi } from 'vitest';
import { RealWsClient } from './client';
import { decodeEnvelope, encodeEnvelope, type Envelope } from './envelope';

/* Fake WebSocket: test drives open/receive/close explicitly. */
class FakeSocket {
  static readonly OPEN = 1;
  static instances: FakeSocket[] = [];

  readyState = 0;
  binaryType = 'blob';
  sent: Uint8Array[] = [];
  onopen?: (e: Event) => void;
  onmessage?: (e: { data: unknown }) => void;
  onclose?: () => void;
  onerror?: () => void;

  constructor(public url: string) {
    FakeSocket.instances.push(this);
  }
  send(frame: Uint8Array): void {
    this.sent.push(frame);
  }
  close(): void {
    this.readyState = 3;
    this.onclose?.();
  }

  /* test helpers */
  open(): void {
    this.readyState = 1;
    this.onopen?.(new Event('open'));
  }
  receive(msg: unknown): void {
    /* legacy JSON inbound - the client stays dual-format */
    this.onmessage?.({ data: JSON.stringify(msg) });
  }
  receiveProto(msg: Envelope): void {
    const buf = encodeEnvelope(msg);
    this.onmessage?.({ data: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) });
  }
  sentFrame(i = 0): ReturnType<typeof decodeEnvelope> {
    return decodeEnvelope(this.sent[i]);
  }
  disconnect(): void {
    this.readyState = 3;
    this.onclose?.();
  }
}

afterEach(() => {
  FakeSocket.instances = [];
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('RealWsClient', () => {
  it('queues frames while connecting and resolves by request_id once open', async () => {
    vi.stubGlobal('WebSocket', FakeSocket);
    const client = new RealWsClient('ws://test');
    const sock = FakeSocket.instances[0];
    const promise = client.call('user', 'GetProfile', { x: 1 });

    expect(sock.sent).toHaveLength(0); // still connecting → queued
    sock.open();
    expect(sock.sent).toHaveLength(1);
    const frame = sock.sentFrame()!;
    expect(frame).toMatchObject({ service: 'user', method: 'GetProfile', input: { x: 1 } });

    sock.receive({ request_id: frame.request_id, output: { name: 'tester' } });
    await expect(promise).resolves.toEqual({ name: 'tester' });
    client.close();
  });

  it('resolves binary proto responses by request_id', async () => {
    vi.stubGlobal('WebSocket', FakeSocket);
    const client = new RealWsClient('ws://test');
    const sock = FakeSocket.instances[0];
    sock.open();
    const promise = client.call('user', 'GetProfile', {});
    const frame = sock.sentFrame()!;
    sock.receiveProto({ request_id: frame.request_id, output: { name: 'proto-tester' } });
    await expect(promise).resolves.toEqual({ name: 'proto-tester' });
    client.close();
  });

  it('routes unmatched service.method frames to push handlers', () => {
    vi.stubGlobal('WebSocket', FakeSocket);
    const client = new RealWsClient('ws://test');
    const sock = FakeSocket.instances[0];
    const seen: string[] = [];
    client.onPush((m) => seen.push(`${m.service}.${m.method}`));
    sock.open();
    sock.receive({ service: 'friend', method: 'PresenceChanged', input: { uuid: 'u1', online: false } });
    expect(seen).toEqual(['friend.PresenceChanged']);
    client.close();
  });

  it('rejects on error frames and per-call timeout', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('WebSocket', FakeSocket);
    const client = new RealWsClient('ws://test', { timeoutMs: 500 });
    const sock = FakeSocket.instances[0];
    sock.open();

    const bad = client.call('mod', 'SetModSetting', {});
    const badFrame = sock.sentFrame()!;
    sock.receive({ request_id: badFrame.request_id, error: 'no setting' });
    await expect(bad).rejects.toThrow('no setting');

    const slow = client.call('mod', 'ListMods', {});
    vi.advanceTimersByTime(600);
    await expect(slow).rejects.toThrow('timeout waiting for mod.ListMods');
    client.close();
  });

  it('rejects pending calls on close() and refuses new ones', async () => {
    vi.stubGlobal('WebSocket', FakeSocket);
    const client = new RealWsClient('ws://test', { reconnect: false });
    const sock = FakeSocket.instances[0];
    sock.open();
    const pending = client.call('user', 'GetProfile', {});
    client.close();
    await expect(pending).rejects.toThrow('ws closed');
    await expect(client.call('user', 'GetProfile', {})).rejects.toThrow('ws closed');
  });
});
