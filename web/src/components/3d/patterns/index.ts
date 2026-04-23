import waveTest from './waveTest';
import patternFlowOriginal from './patternFlowOriginal';
import { PatternDef } from './common';

// Register all available patterns here
const patterns: Record<string, PatternDef> = {
  waveTest,
  patternFlowOriginal,
  // Add more patterns here:
  // tiledWave,
  // flowField,
  // reactionDiffusion,
};

export default patterns;
export type { PatternDef };
