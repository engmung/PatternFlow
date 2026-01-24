
export enum PatternType {
  NOISE = 'NOISE',
  RING_WAVE = 'RING_WAVE'
}

export interface PatternConfig {
  type: PatternType;
  scale: number;    // 1 to 10
  roughness: number; // 0 to 1
  speed: number;    // 0 to 2
}

export const DEFAULT_CONFIG: PatternConfig = {
  type: PatternType.RING_WAVE,
  scale: 2,
  roughness: 0.3,
  speed: 1
};
