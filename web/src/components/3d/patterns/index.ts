import patternFlowOriginal from './patternFlowOriginal';
import patternWaveSaw from './patternWaveSaw';
import { PatternDef } from './common';

// Register all available patterns here
const patterns: Record<string, PatternDef> = {
  patternFlowOriginal,
  patternWaveSaw,
};

export default patterns;
export type { PatternDef };
