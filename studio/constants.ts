import { NodeType, NodeData } from './types';

// Node definition structure
export interface NodeDefinition {
  type: NodeType;
  label: string;
  inputs: string[];
  outputs: string[];
  initialData?: NodeData;
}

// Node definitions (Blender compatible)
export const NODE_DEFINITIONS: Record<NodeType, NodeDefinition> = {
  [NodeType.TIME]: {
    type: NodeType.TIME,
    label: 'Time',
    inputs: [],
    outputs: ['value'],
    initialData: { speed: 1.0 },
  },

  [NodeType.VALUE]: {
    type: NodeType.VALUE,
    label: 'Value',
    inputs: [],
    outputs: ['value'],
    initialData: { value: 0.5 },
  },

  [NodeType.VECTOR]: {
    type: NodeType.VECTOR,
    label: 'Vector',
    inputs: [],
    outputs: ['vector'],
    initialData: { x: 0, y: 0, z: 0 },
  },

  [NodeType.POSITION]: {
    type: NodeType.POSITION,
    label: 'Position',
    inputs: [],
    outputs: ['vector'],
    initialData: {},
  },

  [NodeType.MATH]: {
    type: NodeType.MATH,
    label: 'Math',
    inputs: ['a', 'b'],
    outputs: ['value'],
    initialData: { op: 'ADD' },
  },

  [NodeType.VECTOR_MATH]: {
    type: NodeType.VECTOR_MATH,
    label: 'Vector Math',
    inputs: ['a', 'b'],
    outputs: ['vector', 'value'],
    initialData: { vectorOp: 'ADD', scale: 1.0 },
  },

  [NodeType.WAVE_TEXTURE]: {
    type: NodeType.WAVE_TEXTURE,
    label: 'Wave Texture',
    inputs: ['vector', 'phase'],
    outputs: ['value', 'color'],
    initialData: {
      waveType: 'BANDS',
      direction: 'X',
      profile: 'SINE',
      waveScale: 0.5,
      distortion: 0,
      detail: 0,
      detailScale: 0,
      detailRoughness: 0,
    },
  },

  [NodeType.NOISE_TEXTURE]: {
    type: NodeType.NOISE_TEXTURE,
    label: 'Noise Texture',
    inputs: ['vector'],
    outputs: ['value', 'color'],
    initialData: { noiseScale: 5.0 },
  },

  [NodeType.OUTPUT]: {
    type: NodeType.OUTPUT,
    label: 'Output',
    inputs: ['value'],
    outputs: [],
    initialData: {},
  },
};

// Default node setup (similar to Blender's Wave pattern)
export const DEFAULT_NODES = [
  {
    id: 'time-1',
    type: NodeType.TIME,
    x: 50,
    y: 50,
    data: { speed: 1.0 },
    inputs: {},
  },
  {
    id: 'math-1',
    type: NodeType.MATH,
    x: 200,
    y: 100,
    data: { op: 'MUL' as const, value: 2.0 },
    inputs: {},
  },
  {
    id: 'math-2',
    type: NodeType.MATH,
    x: 350,
    y: 100,
    data: { op: 'ADD' as const, value: 0.5 },
    inputs: {},
  },
  {
    id: 'wave-1',
    type: NodeType.WAVE_TEXTURE,
    x: 500,
    y: 200,
    data: {
      waveType: 'BANDS' as const,
      direction: 'X' as const,
      profile: 'SINE' as const,
      waveScale: 0.5,
      distortion: 0,
      detail: 0,
      detailScale: 0,
      detailRoughness: 0,
    },
    inputs: {},
  },
  {
    id: 'out-1',
    type: NodeType.OUTPUT,
    x: 700,
    y: 200,
    data: {},
    inputs: {},
  },
];

export const DEFAULT_CONNECTIONS = [
  {
    id: 'c-1',
    fromNode: 'time-1',
    fromSocket: 'value',
    toNode: 'math-1',
    toSocket: 'a',
  },
  {
    id: 'c-2',
    fromNode: 'math-1',
    fromSocket: 'value',
    toNode: 'math-2',
    toSocket: 'a',
  },
  {
    id: 'c-3',
    fromNode: 'math-2',
    fromSocket: 'value',
    toNode: 'wave-1',
    toSocket: 'phase',
  },
  {
    id: 'c-4',
    fromNode: 'wave-1',
    fromSocket: 'value',
    toNode: 'out-1',
    toSocket: 'value',
  },
];
