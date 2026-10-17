/* Protobuf wire encoding for the ws envelope - hand-rolled, no runtime dep.

   Schema (all fields length-delimited, payloads stay JSON bytes inside):
     message Envelope {
       string request_id = 1;
       string service    = 2;
       string method     = 3;
       bytes  input      = 4;  // JSON-serialized payload
       bytes  output     = 5;  // JSON-serialized payload
       string error      = 6;
     }

   Correlation stays on request_id exactly like the JSON frames this
   replaces - services and pushes keep an identical decoded shape. Binary
   frames can't collide with JSON: a JSON text frame always starts with
   '{' (0x7B), a proto frame with a field tag like 0x0A/0x12/0x1A. */

const textEnc = new TextEncoder();
const textDec = new TextDecoder();

export interface Envelope {
  request_id?: string;
  service?: string;
  method?: string;
  input?: unknown;
  output?: unknown;
  error?: string;
}

const varint = (n: number, out: number[]): void => {
  let v = n >>> 0;
  while (v > 0x7f) {
    out.push((v & 0x7f) | 0x80);
    v >>>= 7;
  }
  out.push(v);
};

const field = (tag: number, data: Uint8Array, out: number[]): void => {
  varint((tag << 3) | 2, out);
  varint(data.length, out);
  for (const b of data) out.push(b);
};

const jsonBytes = (v: unknown): Uint8Array => textEnc.encode(JSON.stringify(v));

export function encodeEnvelope(msg: Envelope): Uint8Array {
  const out: number[] = [];
  if (msg.request_id !== undefined) field(1, textEnc.encode(msg.request_id), out);
  if (msg.service !== undefined) field(2, textEnc.encode(msg.service), out);
  if (msg.method !== undefined) field(3, textEnc.encode(msg.method), out);
  if (msg.input !== undefined) field(4, jsonBytes(msg.input), out);
  if (msg.output !== undefined) field(5, jsonBytes(msg.output), out);
  if (msg.error !== undefined) field(6, textEnc.encode(msg.error), out);
  return Uint8Array.from(out);
}

/** Decode a proto frame. Returns the same shape the old JSON.parse gave,
    or null on malformed input - callers drop null frames like bad JSON. */
export function decodeEnvelope(buf: Uint8Array): Envelope | null {
  try {
    const msg: Envelope = {};
    let i = 0;
    const readVarint = (): number => {
      let v = 0;
      let shift = 0;
      for (;;) {
        if (i >= buf.length || shift > 35) throw new Error('bad varint');
        const b = buf[i++];
        v |= (b & 0x7f) << shift;
        if (!(b & 0x80)) return v >>> 0;
        shift += 7;
      }
    };
    const readBytes = (): Uint8Array => {
      const len = readVarint();
      if (i + len > buf.length) throw new Error('truncated');
      const s = buf.slice(i, i + len);
      i += len;
      return s;
    };
    const readJson = (): unknown => JSON.parse(textDec.decode(readBytes()));
    while (i < buf.length) {
      const key = readVarint();
      const tag = key >>> 3;
      const wt = key & 7;
      if (wt !== 2) {
        /* Skip non-delimited fields so unknown proto additions don't
           derail parsing - forward-compatible like JSON unknown keys. */
        if (wt === 0) readVarint();
        else if (wt === 5) i += 4;
        else if (wt === 1) i += 8;
        else return null;
        continue;
      }
      switch (tag) {
        case 1: msg.request_id = textDec.decode(readBytes()); break;
        case 2: msg.service = textDec.decode(readBytes()); break;
        case 3: msg.method = textDec.decode(readBytes()); break;
        case 4: msg.input = readJson(); break;
        case 5: msg.output = readJson(); break;
        case 6: msg.error = textDec.decode(readBytes()); break;
        default: readBytes(); break;
      }
    }
    return msg;
  } catch {
    return null;
  }
}
