/**
 * Studio Built-in Presets
 * 
 * These are the default patterns available in the Studio preset menu.
 */
import { NodeType, Node, Connection, ColorRampStop } from './types';

export interface StudioPreset {
  version: 1;
  nodes: Node[];
  connections: Connection[];
  colorRamp: ColorRampStop[];
}

export const STUDIO_PRESETS: Record<string, StudioPreset> = {
  'Pattern 1': {
    version: 1,
    nodes: [
      {
        id: "time-1",
        type: NodeType.TIME,
        x: 50,
        y: 150,
        data: { speed: -0.2 },
        inputs: {}
      },
      {
        id: "wave-1",
        type: NodeType.WAVE_TEXTURE,
        x: 250,
        y: 100,
        data: {
          waveType: "RINGS",
          direction: "X",
          profile: "SINE",
          waveScale: 8.8,
          distortion: 0,
          detail: 0,
          detailScale: 0,
          detailRoughness: 0
        },
        inputs: {}
      },
      {
        id: "out-1",
        type: NodeType.OUTPUT,
        x: 500,
        y: 200,
        data: { resolution: 26, layerHeight: 0.1 },
        inputs: {}
      }
    ],
    connections: [
      {
        id: "c-1",
        fromNode: "time-1",
        fromSocket: "value",
        toNode: "wave-1",
        toSocket: "phase"
      },
      {
        id: "c-2",
        fromNode: "wave-1",
        fromSocket: "value",
        toNode: "out-1",
        toSocket: "value"
      }
    ],
    colorRamp: [
      { position: 0, color: "#000000" },
      { position: 0.31, color: "#fe5858" },
      { position: 0.66, color: "#ff9494" },
      { position: 0.91, color: "#ffffff" }
    ]
  },
  'Pattern 2': {
    version: 1,
    nodes: [
      {
        id: "time-1",
        type: NodeType.TIME,
        x: 23,
        y: 114,
        data: { speed: -0.14 },
        inputs: {}
      },
      {
        id: "wave-1",
        type: NodeType.WAVE_TEXTURE,
        x: 250,
        y: 100,
        data: {
          waveType: "BANDS",
          direction: "X",
          profile: "SINE",
          waveScale: 0.22,
          distortion: 0.05,
          detail: 4.12,
          detailScale: 0.95,
          detailRoughness: 0.09
        },
        inputs: {}
      },
      {
        id: "out-1",
        type: NodeType.OUTPUT,
        x: 500,
        y: 200,
        data: { resolution: 26, layerHeight: 0.16 },
        inputs: {}
      }
    ],
    connections: [
      {
        id: "c-1",
        fromNode: "time-1",
        fromSocket: "value",
        toNode: "wave-1",
        toSocket: "phase"
      },
      {
        id: "c-2",
        fromNode: "wave-1",
        fromSocket: "value",
        toNode: "out-1",
        toSocket: "value"
      }
    ],
    colorRamp: [
      { position: 0, color: "#000000" },
      { position: 0.2755905511811024, color: "#274a9b" },
      { position: 0.5826771653543307, color: "#62abcb" },
      { position: 0.84251968503937, color: "#e1fbfe" }
    ]
  },
  'Pattern 3': {
    version: 1,
    nodes: [
      {
        id: "time-1",
        type: NodeType.TIME,
        x: 50,
        y: 150,
        data: { speed: 0.7 },
        inputs: {}
      },
      {
        id: "wave-1",
        type: NodeType.WAVE_TEXTURE,
        x: 250,
        y: 100,
        data: {
          waveType: "RINGS",
          direction: "X",
          profile: "SINE",
          waveScale: 1.01,
          distortion: 0,
          detail: 1.1,
          detailScale: 10,
          detailRoughness: 0
        },
        inputs: {
          vector: "c-1768215848975"
        }
      },
      {
        id: "out-1",
        type: NodeType.OUTPUT,
        x: 500,
        y: 200,
        data: { resolution: 37, layerHeight: 0.1 },
        inputs: {}
      },
      {
        id: "n-1768215800324",
        type: NodeType.POSITION,
        x: -402.6899007093227,
        y: 448.5735245244442,
        data: {},
        inputs: {}
      },
      {
        id: "n-1768215828982",
        type: NodeType.COMBINE_XYZ,
        x: 189.6372221789883,
        y: 473.8647317520862,
        data: { x: 0, y: 0, z: 0 },
        inputs: {
          x: "c-1768215870238",
          y: "c-1768215977086"
        }
      },
      {
        id: "n-1768215830959",
        type: NodeType.SEPARATE_XYZ,
        x: -212.47976535396418,
        y: 445.80973483156475,
        data: {},
        inputs: {
          vector: "c-1768215834334"
        }
      },
      {
        id: "n-1768215863611",
        type: NodeType.MATH,
        x: -28.2994770888347,
        y: 318.652275782979,
        data: {
          op: "MUL",
          value: 7.1
        },
        inputs: {
          a: "c-1768215867421"
        }
      }
    ],
    connections: [
      {
        id: "c-1",
        fromNode: "time-1",
        fromSocket: "value",
        toNode: "wave-1",
        toSocket: "phase"
      },
      {
        id: "c-2",
        fromNode: "wave-1",
        fromSocket: "value",
        toNode: "out-1",
        toSocket: "value"
      },
      {
        id: "c-1768215834334",
        fromNode: "n-1768215800324",
        fromSocket: "vector",
        toNode: "n-1768215830959",
        toSocket: "vector"
      },
      {
        id: "c-1768215848975",
        fromNode: "n-1768215828982",
        fromSocket: "vector",
        toNode: "wave-1",
        toSocket: "vector"
      },
      {
        id: "c-1768215867421",
        fromNode: "n-1768215830959",
        fromSocket: "x",
        toNode: "n-1768215863611",
        toSocket: "a"
      },
      {
        id: "c-1768215870238",
        fromNode: "n-1768215863611",
        fromSocket: "value",
        toNode: "n-1768215828982",
        toSocket: "x"
      },
      {
        id: "c-1768215977086",
        fromNode: "n-1768215830959",
        fromSocket: "y",
        toNode: "n-1768215828982",
        toSocket: "y"
      }
    ],
    colorRamp: [
      { position: 0, color: "#000000" },
      { position: 0.2874015748031496, color: "#40fe0b" },
      { position: 0.66, color: "#a3ff33" },
      { position: 0.91, color: "#ffffff" }
    ]
  }
};
