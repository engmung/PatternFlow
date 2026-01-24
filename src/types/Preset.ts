import { Node, Connection, ColorRampStop } from '../studio/types';

/**
 * Represents a parameter that the user can control in the "Curated" experience.
 * It maps a user-friendly slider to a specific data property of a specific node.
 */
export interface CuratedParameter {
  id: string;          // Unique ID for the parameter (e.g., "complexity")
  label: string;       // User-facing label (e.g., "Complexity")
  nodeId: string;      // The ID of the node to control
  property: string;    // The key in node.data to control (e.g., "scale", "distortion")
  
  min: number;         // Slider minimum value
  max: number;         // Slider maximum value
  default: number;     // Default value
  step: number;        // Slider step amount
  sensitivity: number; // Multiplier for spread calculation in Curator Mode. Higher = more variation in grid.
}

/**
 * A curated pattern preset.
 * Contains the full node graph + curated parameters + metadata.
 */
export interface CuratedPreset {
  id: string;            // Unique identifier (slug)
  name: string;          // Display name
  description: string;   // Short description
  author: string;        // Creator name
  version: number;       // Schema version (start with 1)
  
  // The "DNA" of the pattern
  nodes: Node[];
  connections: Connection[];
  colorRamp: ColorRampStop[];
  
  // The "Interface" for the user
  parameters: CuratedParameter[]; // Max 2 parameters for simple landing experience
  
  // Rendering settings
  gridResolution: number; // e.g., 40
  
  // Metadata for gallery
  thumbnail?: string;     // Base64 or URL
  createdAt?: string;     // ISO Date string
}
