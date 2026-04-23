import waveTest from './waveTest';
import { PatternDef } from './common';

// Register all available patterns here
const patterns: Record<string, PatternDef> = {
  waveTest,
  // Add more patterns here:
  // tiledWave,
  // flowField,
  // reactionDiffusion,
};

export default patterns;
export type { PatternDef };
