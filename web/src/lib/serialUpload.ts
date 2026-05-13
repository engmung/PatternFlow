/**
 * Web Serial PFV Uploader
 *
 * Sends PFV data directly to ESP32 via browser's Web Serial API.
 * Protocol: "PFV:<filename>:<size>\n" + raw binary
 *
 * License: MIT
 */

export function supportsWebSerial(): boolean {
  return "serial" in navigator;
}

export interface UploadProgress {
  phase: "connecting" | "sending" | "done" | "error";
  percent: number;
  message: string;
}

export async function uploadPfvToDevice(
  pfvData: ArrayBuffer,
  filename: string,
  onProgress: (p: UploadProgress) => void,
): Promise<void> {
  if (!supportsWebSerial()) {
    throw new Error("Web Serial not supported — use Chrome or Edge");
  }

  onProgress({ phase: "connecting", percent: 0, message: "Select COM port…" });

  // User picks the port (browser shows native dialog)
  let port: SerialPort;
  try {
    port = await navigator.serial.requestPort();
  } catch {
    throw new Error("No port selected");
  }

  await port.open({ baudRate: 115200 });

  try {
    const writer = port.writable!.getWriter();
    const reader = port.readable!.getReader();

    // Send upload command
    const cmd = `PFV:${filename}:${pfvData.byteLength}\n`;
    await writer.write(new TextEncoder().encode(cmd));

    onProgress({ phase: "connecting", percent: 0, message: "Waiting for ESP32…" });

    // Wait for READY response (with timeout)
    const ready = await waitForLine(reader, "READY:", 5000);
    if (!ready) {
      reader.releaseLock();
      writer.releaseLock();
      throw new Error("ESP32 did not respond — is the firmware updated?");
    }

    // Send binary data in chunks
    onProgress({ phase: "sending", percent: 0, message: "Uploading…" });

    const CHUNK = 2048;
    const data = new Uint8Array(pfvData);
    let sent = 0;

    while (sent < data.length) {
      const end = Math.min(sent + CHUNK, data.length);
      const chunk = data.subarray(sent, end);
      await writer.write(chunk);
      sent = end;

      const pct = Math.round((sent / data.length) * 100);
      onProgress({
        phase: "sending",
        percent: pct,
        message: `${pct}% — ${(sent / 1024).toFixed(0)}/${(data.length / 1024).toFixed(0)} KB`,
      });

      // Small delay to avoid overwhelming the ESP32 serial buffer
      await sleep(3);
    }

    // Wait for OK or ERR
    const result = await waitForLine(reader, "OK:", 15000);
    reader.releaseLock();
    writer.releaseLock();

    if (result) {
      onProgress({ phase: "done", percent: 100, message: "Upload complete!" });
    } else {
      throw new Error("Upload timed out or failed");
    }
  } finally {
    await port.close();
  }
}

// ── Helpers ──────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForLine(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  prefix: string,
  timeoutMs: number,
): Promise<string | null> {
  const decoder = new TextDecoder();
  let buffer = "";
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const { value, done } = await Promise.race([
      reader.read(),
      sleep(100).then(() => ({ value: undefined, done: false })),
    ]);

    if (done) break;
    if (value) buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith(prefix)) return trimmed;
      if (trimmed.startsWith("ERR:")) throw new Error(`ESP32: ${trimmed}`);
    }
  }
  return null;
}

// ── Device management commands ───────────────────────────

export interface DeviceFile {
  name: string;
  size: number;
}

export interface DeviceInfo {
  files: DeviceFile[];
  freeBytes: number;
}

async function sendSerialCommand(cmd: string, timeoutMs = 5000): Promise<string[]> {
  const port = await navigator.serial.requestPort();
  await port.open({ baudRate: 115200 });

  try {
    const writer = port.writable!.getWriter();
    const reader = port.readable!.getReader();

    await writer.write(new TextEncoder().encode(cmd + "\n"));

    const lines: string[] = [];
    const decoder = new TextDecoder();
    let buffer = "";
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const { value, done } = await Promise.race([
        reader.read(),
        sleep(100).then(() => ({ value: undefined, done: false })),
      ]);
      if (done) break;
      if (value) buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split("\n");
      buffer = parts.pop() || "";
      for (const p of parts) {
        const t = p.trim();
        if (t) lines.push(t);
      }

      // Stop when we see FREE: (end marker for most commands)
      if (lines.some((l) => l.startsWith("FREE:") || l.startsWith("OK:"))) break;
    }

    reader.releaseLock();
    writer.releaseLock();
    return lines;
  } finally {
    await port.close();
  }
}

export async function listDeviceFiles(): Promise<DeviceInfo> {
  const lines = await sendSerialCommand("PFV:LIST");
  const files: DeviceFile[] = [];
  let freeBytes = 0;

  for (const line of lines) {
    if (line.startsWith("FILE:")) {
      const parts = line.substring(5).split(":");
      files.push({ name: parts[0], size: parseInt(parts[1]) || 0 });
    } else if (line.startsWith("FREE:")) {
      freeBytes = parseInt(line.substring(5)) || 0;
    }
  }
  return { files, freeBytes };
}

export async function clearDeviceFiles(): Promise<number> {
  const lines = await sendSerialCommand("PFV:CLEAR");
  const freeLine = lines.find((l) => l.startsWith("FREE:"));
  return freeLine ? parseInt(freeLine.substring(5)) || 0 : 0;
}

export async function deleteDeviceFile(filename: string): Promise<void> {
  const name = filename.startsWith("/") ? filename.substring(1) : filename;
  await sendSerialCommand(`PFV:DELETE:${name}`);
}
