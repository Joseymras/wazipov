// Minimal animated GIF encoder for browser. Uses Canvas frames + LZW.
// Public domain. Produces a 256-color global-palette GIF.
// Adapted (compact) from omggif/gif.js style implementations.

class ByteArray {
  private bytes: number[] = [];
  push(b: number) { this.bytes.push(b & 0xff); }
  pushAll(arr: number[]) { for (const b of arr) this.bytes.push(b & 0xff); }
  writeUTF(s: string) { for (let i = 0; i < s.length; i++) this.bytes.push(s.charCodeAt(i) & 0xff); }
  writeShort(n: number) { this.bytes.push(n & 0xff, (n >> 8) & 0xff); }
  toBlob(): Blob { return new Blob([new Uint8Array(this.bytes)], { type: "image/gif" }); }
  get length() { return this.bytes.length; }
}

// 6-bit palette (216 web-safe + 40 grays)
function buildPalette(): number[] {
  const pal: number[] = [];
  for (let r = 0; r < 6; r++) for (let g = 0; g < 6; g++) for (let b = 0; b < 6; b++) {
    pal.push(r * 51, g * 51, b * 51);
  }
  for (let i = 0; i < 40; i++) { const v = Math.round((i / 39) * 255); pal.push(v, v, v); }
  return pal;
}
const PALETTE = buildPalette();

function quantize(rgba: Uint8ClampedArray): Uint8Array {
  const out = new Uint8Array(rgba.length / 4);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j++) {
    const r = rgba[i], g = rgba[i + 1], b = rgba[i + 2];
    // 6x6x6 web-safe quantization
    const ri = Math.round(r / 51), gi = Math.round(g / 51), bi = Math.round(b / 51);
    out[j] = ri * 36 + gi * 6 + bi;
  }
  return out;
}

// LZW encoder for GIF
function lzwEncode(minCodeSize: number, data: Uint8Array): number[] {
  const CLEAR = 1 << minCodeSize;
  const EOI = CLEAR + 1;
  let codeSize = minCodeSize + 1;
  let nextCode = EOI + 1;
  const dict = new Map<string, number>();
  const out: number[] = [];
  let bitBuffer = 0, bitCount = 0;

  const emit = (code: number) => {
    bitBuffer |= code << bitCount;
    bitCount += codeSize;
    while (bitCount >= 8) {
      out.push(bitBuffer & 0xff);
      bitBuffer >>= 8; bitCount -= 8;
    }
  };

  emit(CLEAR);
  let prefix = String(data[0]);
  for (let i = 1; i < data.length; i++) {
    const k = data[i];
    const merged = prefix + "," + k;
    if (dict.has(merged)) {
      prefix = merged;
    } else {
      // emit code for prefix
      const code = dict.has(prefix) ? dict.get(prefix)! : Number(prefix);
      emit(code);
      dict.set(merged, nextCode++);
      if (nextCode === (1 << codeSize) + 1 && codeSize < 12) codeSize++;
      if (nextCode > 4095) {
        emit(CLEAR);
        dict.clear();
        codeSize = minCodeSize + 1;
        nextCode = EOI + 1;
      }
      prefix = String(k);
    }
  }
  const lastCode = dict.has(prefix) ? dict.get(prefix)! : Number(prefix);
  emit(lastCode);
  emit(EOI);
  if (bitCount > 0) out.push(bitBuffer & 0xff);
  return out;
}

export function encodeGIF(frames: ImageData[], delayMs = 100): Blob {
  if (!frames.length) throw new Error("No frames");
  const w = frames[0].width, h = frames[0].height;
  const ba = new ByteArray();

  // Header
  ba.writeUTF("GIF89a");
  ba.writeShort(w); ba.writeShort(h);
  // Global Color Table flag, color resolution, sort flag, GCT size = 7 -> 256 colors
  ba.push(0xf7);
  ba.push(0); // bg
  ba.push(0); // aspect
  // Global color table (256 * 3)
  for (let i = 0; i < 256; i++) {
    if (i < 256) {
      ba.push(PALETTE[i * 3] || 0);
      ba.push(PALETTE[i * 3 + 1] || 0);
      ba.push(PALETTE[i * 3 + 2] || 0);
    } else { ba.push(0); ba.push(0); ba.push(0); }
  }

  // Netscape loop extension (loop forever)
  ba.push(0x21); ba.push(0xff); ba.push(0x0b);
  ba.writeUTF("NETSCAPE2.0");
  ba.push(0x03); ba.push(0x01); ba.writeShort(0); ba.push(0);

  for (const frame of frames) {
    // Graphic Control Extension
    ba.push(0x21); ba.push(0xf9); ba.push(0x04);
    ba.push(0x00); // no transparency, no disposal
    ba.writeShort(Math.max(2, Math.round(delayMs / 10)));
    ba.push(0); ba.push(0);

    // Image Descriptor
    ba.push(0x2c);
    ba.writeShort(0); ba.writeShort(0);
    ba.writeShort(w); ba.writeShort(h);
    ba.push(0); // no LCT

    const indexed = quantize(frame.data);
    const minCodeSize = 8;
    ba.push(minCodeSize);
    const lzw = lzwEncode(minCodeSize, indexed);
    // Sub-blocks (max 255 bytes each)
    for (let i = 0; i < lzw.length; i += 255) {
      const len = Math.min(255, lzw.length - i);
      ba.push(len);
      for (let j = 0; j < len; j++) ba.push(lzw[i + j]);
    }
    ba.push(0); // block terminator
  }

  ba.push(0x3b); // trailer
  return ba.toBlob();
}
