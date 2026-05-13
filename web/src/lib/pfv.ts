/**
 * PFV1 — Patternflow Video Format v1
 *
 * Binary layout (little-endian):
 *   Offset  Size   Field
 *   0       4      magic        "PFV1"
 *   4       2      headerSize   64
 *   6       2      width        128
 *   8       2      height       64
 *   10      2      fpsMilli     fps * 1000
 *   12      4      frameCount
 *   16      1      format       0x01 = RGB565_LE
 *   17      1      flags        bit0: loop
 *   18      4      loopStart    frame index
 *   22      30     reserved     zero-filled
 *   52      4      dataCrc32
 *   56      4      headerCrc32  (0 in MVP)
 *   60      4      reserved     zero pad to 64
 *   ------- 64 total header bytes -------
 *   64+     N      frame payload (RGB565 LE, row-major)
 *
 * License: MIT
 */

// ── Constants ──────────────────────────────────────────

export const PFV1_MAGIC = "PFV1";
export const PFV1_HEADER_SIZE = 64;
export const PFV1_FORMAT_RGB565_LE = 0x01;

export const PFV_WIDTH = 128;
export const PFV_HEIGHT = 64;
export const PFV_FRAME_BYTES = PFV_WIDTH * PFV_HEIGHT * 2; // 16 384

// ── Types ──────────────────────────────────────────────

export interface PFV1Header {
  magic: string;
  headerSize: number;
  width: number;
  height: number;
  fpsMilli: number;
  frameCount: number;
  format: number;
  flags: number;
  loopStart: number;
  dataCrc32: number;
  headerCrc32: number;
}

export interface PFV1File {
  header: PFV1Header;
  frames: Uint16Array[];
}

// ── CRC-32 (ISO 3309 / ITU-T V.42) ────────────────────

const crcTable: Uint32Array = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[i] = c;
  }
  return t;
})();

export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// ── RGB565 conversion ──────────────────────────────────

/** Pack 8-bit RGB to 16-bit RGB565 little-endian. */
export function rgb888toRgb565(r: number, g: number, b: number): number {
  const r5 = (r >> 3) & 0x1f;
  const g6 = (g >> 2) & 0x3f;
  const b5 = (b >> 3) & 0x1f;
  return (r5 << 11) | (g6 << 5) | b5;
}

/** Unpack 16-bit RGB565 to 8-bit [r, g, b]. */
export function rgb565toRgb888(pixel: number): [number, number, number] {
  const r5 = (pixel >> 11) & 0x1f;
  const g6 = (pixel >> 5) & 0x3f;
  const b5 = pixel & 0x1f;
  return [
    (r5 << 3) | (r5 >> 2),
    (g6 << 2) | (g6 >> 4),
    (b5 << 3) | (b5 >> 2),
  ];
}

/** Convert an RGBA ImageData (128×64) to a RGB565 Uint16Array. */
export function imageDataToRgb565(imageData: ImageData): Uint16Array {
  const pixelCount = imageData.width * imageData.height;
  const out = new Uint16Array(pixelCount);
  const d = imageData.data;
  for (let i = 0; i < pixelCount; i++) {
    const off = i * 4;
    out[i] = rgb888toRgb565(d[off], d[off + 1], d[off + 2]);
  }
  return out;
}

/** Convert a RGB565 Uint16Array to RGBA ImageData (128×64). */
export function rgb565ToImageData(
  frame: Uint16Array,
  width = PFV_WIDTH,
  height = PFV_HEIGHT,
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < frame.length; i++) {
    const [r, g, b] = rgb565toRgb888(frame[i]);
    const off = i * 4;
    data[off] = r;
    data[off + 1] = g;
    data[off + 2] = b;
    data[off + 3] = 255;
  }
  return new ImageData(data, width, height);
}

// ── Encoder ────────────────────────────────────────────

export function encodePFV1(
  frames: Uint16Array[],
  fps: number,
  options?: { loop?: boolean; loopStart?: number },
): ArrayBuffer {
  const frameCount = frames.length;
  const payloadSize = frameCount * PFV_FRAME_BYTES;
  const totalSize = PFV1_HEADER_SIZE + payloadSize;
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // Write frame payload first (to compute CRC before header)
  for (let f = 0; f < frameCount; f++) {
    const frameBytes = new Uint8Array(frames[f].buffer, frames[f].byteOffset, frames[f].byteLength);
    bytes.set(frameBytes, PFV1_HEADER_SIZE + f * PFV_FRAME_BYTES);
  }

  // Compute data CRC
  const payloadSlice = new Uint8Array(buffer, PFV1_HEADER_SIZE, payloadSize);
  const dataCrc = crc32(payloadSlice);

  // Write header
  // magic
  bytes[0] = 0x50; // P
  bytes[1] = 0x46; // F
  bytes[2] = 0x56; // V
  bytes[3] = 0x31; // 1

  view.setUint16(4, PFV1_HEADER_SIZE, true);   // headerSize
  view.setUint16(6, PFV_WIDTH, true);           // width
  view.setUint16(8, PFV_HEIGHT, true);          // height
  view.setUint16(10, Math.round(fps * 1000), true); // fpsMilli
  view.setUint32(12, frameCount, true);         // frameCount
  bytes[16] = PFV1_FORMAT_RGB565_LE;            // format
  bytes[17] = (options?.loop !== false ? 0x01 : 0x00); // flags
  view.setUint32(18, options?.loopStart ?? 0, true);   // loopStart
  // reserved bytes 22–51 are already zero
  view.setUint32(52, dataCrc, true);            // dataCrc32
  view.setUint32(56, 0, true);                  // headerCrc32 (MVP: 0)
  // bytes 60-63 reserved pad, already zero

  return buffer;
}

// ── Decoder ────────────────────────────────────────────

export function decodePFV1(buffer: ArrayBuffer): PFV1File {
  if (buffer.byteLength < PFV1_HEADER_SIZE) {
    throw new Error("File too small to contain PFV1 header");
  }

  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // Check magic
  const magic = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  if (magic !== PFV1_MAGIC) {
    throw new Error(`Invalid magic: expected "${PFV1_MAGIC}", got "${magic}"`);
  }

  const headerSize = view.getUint16(4, true);
  const width = view.getUint16(6, true);
  const height = view.getUint16(8, true);
  const fpsMilli = view.getUint16(10, true);
  const frameCount = view.getUint32(12, true);
  const format = bytes[16];
  const flags = bytes[17];
  const loopStart = view.getUint32(18, true);
  const dataCrc32 = view.getUint32(52, true);
  const headerCrc32 = view.getUint32(56, true);

  if (format !== PFV1_FORMAT_RGB565_LE) {
    throw new Error(`Unsupported format: 0x${format.toString(16)}`);
  }

  if (width !== PFV_WIDTH || height !== PFV_HEIGHT) {
    throw new Error(`Unsupported dimensions: ${width}×${height}, expected ${PFV_WIDTH}×${PFV_HEIGHT}`);
  }

  const frameBytes = width * height * 2;
  const expectedPayload = frameCount * frameBytes;

  if (buffer.byteLength < headerSize + expectedPayload) {
    throw new Error(
      `File truncated: expected ${headerSize + expectedPayload} bytes, got ${buffer.byteLength}`,
    );
  }

  // Verify data CRC
  const payloadSlice = new Uint8Array(buffer, headerSize, expectedPayload);
  const computedCrc = crc32(payloadSlice);
  if (computedCrc !== dataCrc32) {
    throw new Error(
      `Data CRC mismatch: expected 0x${dataCrc32.toString(16)}, computed 0x${computedCrc.toString(16)}`,
    );
  }

  // Extract frames
  const frames: Uint16Array[] = [];
  for (let f = 0; f < frameCount; f++) {
    const offset = headerSize + f * frameBytes;
    const frameData = new Uint16Array(buffer.slice(offset, offset + frameBytes));
    frames.push(frameData);
  }

  return {
    header: {
      magic,
      headerSize,
      width,
      height,
      fpsMilli,
      frameCount,
      format,
      flags,
      loopStart,
      dataCrc32,
      headerCrc32,
    },
    frames,
  };
}

// ── Helpers ────────────────────────────────────────────

/** Estimated PFV1 file size in bytes. */
export function estimatePfvSize(frameCount: number): number {
  return PFV1_HEADER_SIZE + frameCount * PFV_FRAME_BYTES;
}

/** Format bytes to human readable string. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Get fps from fpsMilli field. */
export function fpsFromMilli(fpsMilli: number): number {
  return fpsMilli / 1000;
}
