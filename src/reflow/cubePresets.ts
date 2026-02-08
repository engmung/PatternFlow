/**
 * Reflow Cube Presets - URL-Based Storage
 * 
 * Same structure as demoPreset.ts - presets stored as compressed LZ strings.
 * Decoded at runtime using urlSharing utilities.
 * 
 * To add a new preset:
 * 1. Create pattern in Studio
 * 2. Click Share button to get URL
 * 3. Copy the ?pattern= value
 * 4. Add entry here with that encodedPattern
 */

import { decodePreset, ShareablePreset } from '../utils/urlSharing';

export interface CubePresetUrl {
  id: number;
  name: string;
  description: string;
  encodedPattern: string;
}

/**
 * All cube presets - add new entries with incrementing IDs
 */
export const CUBE_PRESET_URLS: CubePresetUrl[] = [
  {
    id: 1,
    name: "Classic Rings",
    description: "The original Patternflow pattern - concentric rings with smooth sine wave",
    // From user's URL: http://localhost:3000/?pattern=...
    encodedPattern: "N4Igdg9gJgpgziAXAbVASykkAXNBbGAWgEYQAaHATwAcYsAVASQFkBRckADyQBYeLKSYgAYAbBSgBDbJKSg4tGJkTCAdKIC+FNGGoBXbAkTANW9MpAB3SQDcipCthp1EIAOoBBAGqsA+vVYADXoAVQAldgpuRAAmAFZhASFhRJApGTkrWxh6ZywwxgA5AHEAZQ4oNAAnGABjXAgwLECOaiqIADM0ABsXEFKiyKy7UtrJXuSJNDhsCCqGppUJGBkepFTYVe7R8ZcRZa2wiD0AcwALMHgjYS0QHX1DTLt6uaxakgB2UQAOGOI4748b4ATg+cQ4cDGE1c72IX2BAGYYt84nDgTFgRVprN5mhGkgwHput1TGRzFhjtgSBwnLQsAB5EL0AAKTI40QSqUEsRSEmksmMIBqcAg3QMeMWxGIFG6kkoMCqAAkYGhzth1qp4rd7gYjKBhaLxfiYZ8PsIEQjgaIYqIvjwQKYALoUWqNS71CVGVB3Cywjgddp4QrQPq4AjUigBiB4UoQWoAaxWWBs4z0dEcEGDsCw1jsEZwEFjCaTrmoZ0kcDoZh9b0IMX9gazfVz9gb0aLifVrhTYvTBabFIM+dmHZLIB7aYdzpAru6czCkjw1CQ3uoEDgaAW6xdotergAxCkj8IHWSQGuN1uVKoeBjiBaUb9bR9iKI4nEd3Oqlh94+AeDqwvTcJQ1D4EWtGJhB4D4Yj4YRgT4YFPz3EB9w6dCMKnCgTiqDAwngQ0rylDQgA"
  },
  // Add more presets here with id: 2, 3, 4...
];

/**
 * Decoded presets cache (computed once at load)
 */
interface DecodedCubePreset extends ShareablePreset {
  id: number;
  name: string;
  description: string;
}

const DECODED_CUBE_PRESETS: Map<number, DecodedCubePreset> = new Map();

// Decode all presets at module load
CUBE_PRESET_URLS.forEach(preset => {
  const decoded = decodePreset(preset.encodedPattern);
  if (decoded) {
    DECODED_CUBE_PRESETS.set(preset.id, {
      ...decoded,
      id: preset.id,
      name: preset.name,
      description: preset.description
    });
  } else {
    console.error(`Failed to decode cube preset: ${preset.name}`);
  }
});

/**
 * Get preset by ID
 */
export function getCubePresetById(id: number): DecodedCubePreset | null {
  return DECODED_CUBE_PRESETS.get(id) || null;
}

/**
 * Get all available preset IDs
 */
export function getAllCubePresetIds(): number[] {
  return Array.from(DECODED_CUBE_PRESETS.keys()).sort((a, b) => a - b);
}

/**
 * Check if a preset exists
 */
export function cubePresetExists(id: number): boolean {
  return DECODED_CUBE_PRESETS.has(id);
}

/**
 * Get total preset count
 */
export function getCubePresetCount(): number {
  return DECODED_CUBE_PRESETS.size;
}
