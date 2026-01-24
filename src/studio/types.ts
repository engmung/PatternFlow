// Node Types (Blender compatible)
export enum NodeType {
  TIME = 'TIME',
  VALUE = 'VALUE',
  VECTOR = 'VECTOR',
  POSITION = 'POSITION',  // UV coordinates output
  COMBINE_XYZ = 'COMBINE_XYZ',
  SEPARATE_XYZ = 'SEPARATE_XYZ',
  MATH = 'MATH',
  VECTOR_MATH = 'VECTOR_MATH',
  WAVE_TEXTURE = 'WAVE_TEXTURE',
  NOISE_TEXTURE = 'NOISE_TEXTURE',
  OUTPUT = 'OUTPUT',
}

// Math operations (Blender compatible)
export type MathOp =
  | 'ADD' | 'SUB' | 'MUL' | 'DIV' | 'MULTIPLY_ADD' | 'POWER' | 'LOG'
  | 'SQRT' | 'INVERSE_SQRT' | 'ABSOLUTE' | 'EXPONENT'
  | 'MIN' | 'MAX' | 'LESS_THAN' | 'GREATER_THAN' | 'SIGN' | 'COMPARE' | 'SMOOTH_MIN' | 'SMOOTH_MAX'
  | 'ROUND' | 'FLOOR' | 'CEIL' | 'TRUNC' | 'FRACT' | 'MODULO' | 'FLOORED_MODULO' | 'WRAP' | 'SNAP' | 'PINGPONG'
  | 'SIN' | 'COS' | 'TAN' | 'ASIN' | 'ACOS' | 'ATAN' | 'ATAN2' | 'SINH' | 'COSH' | 'TANH'
  | 'RADIANS' | 'DEGREES';

// Vector Math operations (Blender compatible)
export type VectorMathOp =
  | 'ADD' | 'SUBTRACT' | 'MULTIPLY' | 'DIVIDE' | 'MULTIPLY_ADD' | 'SCALE'
  | 'CROSS_PRODUCT' | 'PROJECT' | 'REFLECT' | 'REFRACT' | 'FACEFORWARD'
  | 'DOT_PRODUCT' | 'DISTANCE' | 'LENGTH' | 'NORMALIZE'
  | 'ABSOLUTE' | 'POWER' | 'SIGN' | 'MINIMUM' | 'MAXIMUM'
  | 'FLOOR' | 'CEIL' | 'FRACTION' | 'MODULO' | 'WRAP' | 'SNAP'
  | 'SINE' | 'COSINE' | 'TANGENT';

// Wave types (Blender compatible)
export type WaveType = 'BANDS' | 'RINGS';

// Wave direction (Blender compatible)
export type WaveDirection = 'X' | 'Y' | 'Z' | 'DIAGONAL' | 'SPHERICAL';

// Wave profile (Blender compatible)
export type WaveProfile = 'SINE' | 'SAW';

// Node data for each type
export interface NodeData {
  // TIME node
  speed?: number;

  // VALUE node
  value?: number;

  // VECTOR node
  x?: number;
  y?: number;
  z?: number;

  // MATH node
  op?: MathOp;

  // VECTOR_MATH node
  vectorOp?: VectorMathOp;
  scale?: number;

  // WAVE_TEXTURE node
  waveType?: WaveType;
  direction?: WaveDirection;
  profile?: WaveProfile;
  waveScale?: number;
  distortion?: number;
  detail?: number;
  detailScale?: number;
  detailRoughness?: number;

  // NOISE_TEXTURE node
  noiseScale?: number;

  // OUTPUT node
  resolution?: number;
  layerHeight?: number;
}

// Node definition
export interface Node {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  data: NodeData;
  inputs: Record<string, string | null>; // socket name -> connection id
}

// Connection between nodes
export interface Connection {
  id: string;
  fromNode: string;
  fromSocket: string;
  toNode: string;
  toSocket: string;
}

// Grid configuration (Blender compatible: 10x10 size)
export const GRID_SIZE = 40; // Resolution (number of cells)
export const GRID_WORLD_SIZE = 10; // World size (matches Blender's 10x10)

// Color Ramp stop interface
export interface ColorRampStop {
  position: number;  // 0-1
  color: string;     // hex color
}

// Default Color Ramp stops (Blender compatible: 0%, 31%, 66%, 91%)
export const DEFAULT_COLOR_RAMP_STOPS: ColorRampStop[] = [
  { position: 0.0, color: '#ffffff' },   // Base - White
  { position: 0.31, color: '#a2a2a2' },  // Light Gray
  { position: 0.66, color: '#262626' },  // Dark Gray
  { position: 0.91, color: '#000000' },  // Top - Black
];
