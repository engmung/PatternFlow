import { CuratedPreset } from '../types/Preset';

export const DEMO_PRESETS: CuratedPreset[] = [
  {
    "id": "p-1769301974556",
    "name": "Dynamic Waves",
    "description": "Complex dual-parameter interaction",
    "author": "Artist",
    "version": 1,
    "nodes": [
      {
        "id": "time-1",
        "type": "TIME",
        "x": 50,
        "y": 150,
        "data": {
          "speed": -0.2
        },
        "inputs": {}
      },
      {
        "id": "wave-1",
        "type": "WAVE_TEXTURE",
        "x": 250,
        "y": 100,
        "data": {
          "waveType": "RINGS",
          "direction": "X",
          "profile": "SINE",
          "waveScale": 8.8,
          "distortion": 0,
          "detail": 0,
          "detailScale": 0,
          "detailRoughness": 0
        },
        "inputs": {
          "scale": "c-1769301403439"
        }
      },
      {
        "id": "out-1",
        "type": "OUTPUT",
        "x": 567,
        "y": 197,
        "data": {
          "resolution": 40,
          "layerHeight": 0.1
        },
        "inputs": {
          "resolution": "c-1769301541812"
        }
      },
      {
        "id": "n-1769301399206",
        "type": "PARAMETER",
        "x": 45,
        "y": 276,
        "data": {
          "value": 2,
          "min": 0.1,
          "max": 50,
          "label": "Frequency",
          "spread": 0.205
        },
        "inputs": {}
      },
      {
        "id": "n-1769301531920",
        "type": "PARAMETER",
        "x": 47,
        "y": 567,
        "data": {
          "value": 13.92,
          "min": 7,
          "max": 50,
          "label": "Complexity",
          "spread": 0.126
        },
        "inputs": {}
      }
    ],
    "connections": [
      {
        "id": "c-1",
        "fromNode": "time-1",
        "fromSocket": "value",
        "toNode": "wave-1",
        "toSocket": "phase"
      },
      {
        "id": "c-2",
        "fromNode": "wave-1",
        "fromSocket": "value",
        "toNode": "out-1",
        "toSocket": "value"
      },
      {
        "id": "c-1769301403439",
        "fromNode": "n-1769301399206",
        "fromSocket": "value",
        "toNode": "wave-1",
        "toSocket": "scale"
      },
      {
        "id": "c-1769301541812",
        "fromNode": "n-1769301531920",
        "fromSocket": "value",
        "toNode": "out-1",
        "toSocket": "resolution"
      }
    ],
    "colorRamp": [
      {
        "position": 0,
        "color": "#000000"
      },
      {
        "position": 0.31,
        "color": "#fe5858"
      },
      {
        "position": 0.66,
        "color": "#ff9494"
      },
      {
        "position": 0.91,
        "color": "#ffffff"
      }
    ],
    "parameters": [
      {
        "id": "param-n-1769301399206",
        "label": "Frequency",
        "nodeId": "n-1769301399206",
        "property": "value",
        "min": 0.1,
        "max": 50,
        "default": 2,
        "step": 0.205
      },
      {
        "id": "param-n-1769301531920",
        "label": "Complexity",
        "nodeId": "n-1769301531920",
        "property": "value",
        "min": 7,
        "max": 50,
        "default": 13.92,
        "step": 0.126
      }
    ],
    "gridResolution": 40,
    "createdAt": "2026-01-25T00:46:14.556Z"
  },
  {
    "id": "p-1769302067410",
    "name": "Soft Flow",
    "description": "Simple single-parameter deformation",
    "author": "Artist",
    "version": 1,
    "nodes": [
      {
        "id": "time-1",
        "type": "TIME",
        "x": 36,
        "y": 110,
        "data": {
          "speed": -0.14
        },
        "inputs": {}
      },
      {
        "id": "wave-1",
        "type": "WAVE_TEXTURE",
        "x": 250,
        "y": 100,
        "data": {
          "waveType": "BANDS",
          "direction": "X",
          "profile": "SINE",
          "waveScale": 0.22,
          "distortion": 0.05,
          "detail": 4.12,
          "detailScale": 0.95,
          "detailRoughness": 0.09
        },
        "inputs": {
          "scale": "c-1769302021495"
        }
      },
      {
        "id": "out-1",
        "type": "OUTPUT",
        "x": 500,
        "y": 200,
        "data": {
          "resolution": 40,
          "layerHeight": 0.16
        },
        "inputs": {}
      },
      {
        "id": "n-1769302014953",
        "type": "PARAMETER",
        "x": 33,
        "y": 238,
        "data": {
          "value": 0.86,
          "min": 0,
          "max": 5,
          "label": "Flow Intensity",
          "spread": 0.174
        },
        "inputs": {}
      }
    ],
    "connections": [
      {
        "id": "c-1",
        "fromNode": "time-1",
        "fromSocket": "value",
        "toNode": "wave-1",
        "toSocket": "phase"
      },
      {
        "id": "c-2",
        "fromNode": "wave-1",
        "fromSocket": "value",
        "toNode": "out-1",
        "toSocket": "value"
      },
      {
        "id": "c-1769302021495",
        "fromNode": "n-1769302014953",
        "fromSocket": "value",
        "toNode": "wave-1",
        "toSocket": "scale"
      }
    ],
    "colorRamp": [
      {
        "position": 0,
        "color": "#000000"
      },
      {
        "position": 0.2755905511811024,
        "color": "#274a9b"
      },
      {
        "position": 0.5826771653543307,
        "color": "#62abcb"
      },
      {
        "position": 0.84251968503937,
        "color": "#e1fbfe"
      }
    ],
    "parameters": [
      {
        "id": "param-n-1769302014953",
        "label": "Flow Intensity",
        "nodeId": "n-1769302014953",
        "property": "value",
        "min": 0,
        "max": 5,
        "default": 0.86,
        "step": 0.174
      }
    ],
    "gridResolution": 40,
    "createdAt": "2026-01-25T00:47:47.410Z"
  }
] as any[];

export const DEMO_PRESET = DEMO_PRESETS[0];
