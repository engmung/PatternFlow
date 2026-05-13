/**
 * Video Frame Decoder
 *
 * Extracts frames from video files using WebCodecs API (primary)
 * or <video> element fallback.
 *
 * License: MIT
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MP4BoxFile = any;

export interface ExtractOptions {
  targetFps: number;
  trimStart?: number;
  trimEnd?: number;
  onProgress?: (progress: number) => void;
}

export interface SourceInfo {
  duration: number;
  width: number;
  height: number;
  codec?: string;
}

export function supportsWebCodecs(): boolean {
  return typeof VideoDecoder !== "undefined" && typeof VideoFrame !== "undefined";
}

// ── WebCodecs path ─────────────────────────────────────

export async function extractFramesWebCodecs(
  file: File,
  opts: ExtractOptions,
): Promise<{ info: SourceInfo; frames: VideoFrame[] }> {
  const mp4box = await import("mp4box");

  return new Promise((resolve, reject) => {
    const mp4: MP4BoxFile = mp4box.createFile();
    const frames: VideoFrame[] = [];
    let info: SourceInfo | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let videoTrack: any = null;
    let sampleCount = 0;
    let processedSamples = 0;
    let decoder: VideoDecoder | null = null;

    const trimStart = opts.trimStart ?? 0;

    // Determine which decoded frames to keep based on target fps
    const keepFrame = (timestampUs: number): boolean => {
      const timeSec = timestampUs / 1_000_000;
      if (timeSec < trimStart) return false;
      if (opts.trimEnd !== undefined && timeSec > opts.trimEnd) return false;
      // Accept frames at target fps intervals
      const frameInterval = 1 / opts.targetFps;
      const relTime = timeSec - trimStart;
      const frameIdx = Math.round(relTime / frameInterval);
      const expectedTime = frameIdx * frameInterval;
      return Math.abs(relTime - expectedTime) < frameInterval * 0.4;
    };

    mp4.onReady = (fileInfo: { tracks: Array<{ type: string; id: number; codec: string; video?: { width: number; height: number }; nb_samples: number; timescale: number; duration: number }> }) => {
      videoTrack = fileInfo.tracks.find((t) => t.type === "video");
      if (!videoTrack) {
        reject(new Error("No video track found"));
        return;
      }

      const duration = videoTrack.duration / videoTrack.timescale;
      info = {
        duration,
        width: videoTrack.video?.width ?? 0,
        height: videoTrack.video?.height ?? 0,
        codec: videoTrack.codec,
      };
      sampleCount = videoTrack.nb_samples;

      decoder = new VideoDecoder({
        output: (frame: VideoFrame) => {
          if (keepFrame(frame.timestamp)) {
            frames.push(frame);
          } else {
            frame.close();
          }
          processedSamples++;
          opts.onProgress?.(Math.min(0.99, processedSamples / sampleCount));
        },
        error: (e: DOMException) => reject(e),
      });

      decoder.configure({
        codec: videoTrack.codec,
        codedWidth: videoTrack.video?.width,
        codedHeight: videoTrack.video?.height,
        description: getDescription(mp4box, mp4, videoTrack.id),
      });

      mp4.setExtractionOptions(videoTrack.id);
      mp4.start();
    };

    mp4.onSamples = (_id: number, _user: unknown, samples: Array<{ data: ArrayBuffer; is_sync: boolean; cts: number; duration: number; timescale: number }>) => {
      for (const sample of samples) {
        if (!decoder) continue;
        decoder.decode(
          new EncodedVideoChunk({
            type: sample.is_sync ? "key" : "delta",
            timestamp: (sample.cts / sample.timescale) * 1_000_000,
            duration: (sample.duration / sample.timescale) * 1_000_000,
            data: sample.data,
          }),
        );
      }
    };

    mp4.onError = (e: Error) => reject(e);

    // Read file into mp4box
    const reader = file.stream().getReader();
    let offset = 0;

    function pump(): Promise<void> {
      return reader.read().then(({ done, value }) => {
        if (done) {
          mp4.flush();
          // Wait for decoder to finish
          if (decoder) {
            decoder.flush().then(() => {
              decoder!.close();
              opts.onProgress?.(1);
              if (info) resolve({ info, frames });
              else reject(new Error("No video info extracted"));
            }).catch(reject);
          } else {
            reject(new Error("Decoder was never initialised — is this a valid video?"));
          }
          return;
        }
        // mp4box requires a clean ArrayBuffer with a .fileStart property
        const clean = new ArrayBuffer(value.byteLength) as ArrayBuffer & { fileStart: number };
        new Uint8Array(clean).set(value);
        clean.fileStart = offset;
        offset += value.byteLength;
        mp4.appendBuffer(clean);
        return pump();
      });
    }

    pump().catch(reject);
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDescription(mp4box: any, mp4file: MP4BoxFile, trackId: number): Uint8Array | undefined {
  const trak = mp4file.getTrackById(trackId);
  if (!trak) return undefined;
  const stbl = trak.mdia?.minf?.stbl;
  const entry = stbl?.stsd?.entries?.[0];
  if (!entry) return undefined;
  const box = entry.avcC || entry.hvcC || entry.vpcC;
  if (!box) return undefined;
  const DS = mp4box.DataStream;
  const stream = new DS(undefined, 0, DS.BIG_ENDIAN);
  box.write(stream);
  return new Uint8Array(stream.buffer, 8);
}

// ── Legacy <video> fallback ────────────────────────────

export async function extractFramesLegacy(
  file: File,
  opts: ExtractOptions,
): Promise<{ info: SourceInfo; bitmaps: ImageBitmap[] }> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.preload = "auto";
  video.src = url;

  await new Promise<void>((res, rej) => {
    video.onloadedmetadata = () => res();
    video.onerror = () => rej(new Error("Failed to load video"));
  });

  const info: SourceInfo = {
    duration: video.duration,
    width: video.videoWidth,
    height: video.videoHeight,
  };

  const trimStart = opts.trimStart ?? 0;
  const trimEnd = opts.trimEnd ?? video.duration;
  const interval = 1 / opts.targetFps;
  const bitmaps: ImageBitmap[] = [];
  const totalFrames = Math.floor((trimEnd - trimStart) * opts.targetFps);

  for (let i = 0; i < totalFrames; i++) {
    const time = trimStart + i * interval;
    video.currentTime = time;
    await new Promise<void>((res) => { video.onseeked = () => res(); });
    const bmp = await createImageBitmap(video);
    bitmaps.push(bmp);
    opts.onProgress?.(Math.min(0.99, (i + 1) / totalFrames));
  }

  opts.onProgress?.(1);
  URL.revokeObjectURL(url);
  return { info, bitmaps };
}

// ── Get source info without extracting frames ──────────

export async function getVideoInfo(file: File): Promise<SourceInfo> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.preload = "metadata";
  video.src = url;

  await new Promise<void>((res, rej) => {
    video.onloadedmetadata = () => res();
    video.onerror = () => rej(new Error("Failed to load video metadata"));
  });

  const info: SourceInfo = {
    duration: video.duration,
    width: video.videoWidth,
    height: video.videoHeight,
  };

  URL.revokeObjectURL(url);
  return info;
}
