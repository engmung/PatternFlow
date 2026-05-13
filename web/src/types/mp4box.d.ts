declare module "mp4box" {
  interface MP4BoxFile {
    onReady: (info: MP4Info) => void;
    onSamples: (id: number, user: unknown, samples: MP4Sample[]) => void;
    onError: (e: Error) => void;
    appendBuffer: (buffer: ArrayBuffer & { fileStart?: number }) => void;
    start: () => void;
    flush: () => void;
    setExtractionOptions: (trackId: number, user?: unknown, options?: { nbSamples?: number }) => void;
    getTrackById: (id: number) => unknown;
    DataStream: {
      new (buffer: unknown, offset: number, endian: boolean): { buffer: ArrayBuffer };
      BIG_ENDIAN: boolean;
    };
  }

  interface MP4Info {
    tracks: MP4Track[];
    duration: number;
    timescale: number;
  }

  interface MP4Track {
    type: string;
    id: number;
    codec: string;
    nb_samples: number;
    timescale: number;
    duration: number;
    video?: { width: number; height: number };
    audio?: { sample_rate: number; channel_count: number };
  }

  interface MP4Sample {
    data: ArrayBuffer;
    is_sync: boolean;
    cts: number;
    dts: number;
    duration: number;
    timescale: number;
    size: number;
  }

  function createFile(): MP4BoxFile;

  const MP4Box: { createFile: typeof createFile; DataStream: MP4BoxFile["DataStream"] };
  export default MP4Box;
}
