import { Node, Connection, NodeType, GRID_WORLD_SIZE, VectorMathOp } from '../types';
import { noise } from '../../utils/noise';

// Vector type for internal calculations
interface Vec3 {
  x: number;
  y: number;
  z: number;
}

// Cache for node evaluations within a single frame
const evalCache = new Map<string, number>();
const evalVectorCache = new Map<string, Vec3>();

// Vector Math operations
function vectorMathOp(op: VectorMathOp, a: Vec3, b: Vec3, scale: number): Vec3 | number {
  switch (op) {
    case 'ADD':
      return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
    case 'SUBTRACT':
      return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
    case 'MULTIPLY':
      return { x: a.x * b.x, y: a.y * b.y, z: a.z * b.z };
    case 'DIVIDE':
      return {
        x: b.x !== 0 ? a.x / b.x : 0,
        y: b.y !== 0 ? a.y / b.y : 0,
        z: b.z !== 0 ? a.z / b.z : 0,
      };
    case 'CROSS_PRODUCT':
      return {
        x: a.y * b.z - a.z * b.y,
        y: a.z * b.x - a.x * b.z,
        z: a.x * b.y - a.y * b.x,
      };
    case 'DOT_PRODUCT':
      return a.x * b.x + a.y * b.y + a.z * b.z;
    case 'NORMALIZE': {
      const len = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
      if (len === 0) return { x: 0, y: 0, z: 0 };
      return { x: a.x / len, y: a.y / len, z: a.z / len };
    }
    case 'LENGTH':
      return Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
    case 'DISTANCE':
      return Math.sqrt(
        (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2
      );
    case 'SCALE':
      return { x: a.x * scale, y: a.y * scale, z: a.z * scale };
    case 'FLOOR':
      return { x: Math.floor(a.x), y: Math.floor(a.y), z: Math.floor(a.z) };
    case 'CEIL':
      return { x: Math.ceil(a.x), y: Math.ceil(a.y), z: Math.ceil(a.z) };
    case 'FRACTION':
      return { x: a.x - Math.floor(a.x), y: a.y - Math.floor(a.y), z: a.z - Math.floor(a.z) };
    case 'ABSOLUTE':
      return { x: Math.abs(a.x), y: Math.abs(a.y), z: Math.abs(a.z) };
    case 'MINIMUM':
      return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), z: Math.min(a.z, b.z) };
    case 'MAXIMUM':
      return { x: Math.max(a.x, b.x), y: Math.max(a.y, b.y), z: Math.max(a.z, b.z) };
    case 'SINE':
      return { x: Math.sin(a.x), y: Math.sin(a.y), z: Math.sin(a.z) };
    case 'COSINE':
      return { x: Math.cos(a.x), y: Math.cos(a.y), z: Math.cos(a.z) };
    case 'TANGENT':
      return { x: Math.tan(a.x), y: Math.tan(a.y), z: Math.tan(a.z) };
    default:
      return { x: 0, y: 0, z: 0 };
  }
}

// Evaluate a single node - returns scalar value
function evaluateNode(
  node: Node,
  nodes: Node[],
  connections: Connection[],
  u: number,
  v: number,
  time: number
): number {
  const cacheKey = `${node.id}-${u.toFixed(4)}-${v.toFixed(4)}-${time.toFixed(4)}`;
  if (evalCache.has(cacheKey)) {
    return evalCache.get(cacheKey)!;
  }

  let result = 0;

  // Get scalar input value from connection
  const getInput = (socketName: string, defaultValue: number = 0): number => {
    const conn = connections.find(
      (c) => c.toNode === node.id && c.toSocket === socketName
    );
    if (!conn) return defaultValue;

    const sourceNode = nodes.find((n) => n.id === conn.fromNode);
    if (!sourceNode) return defaultValue;

    return evaluateNode(sourceNode, nodes, connections, u, v, time);
  };

  // Get vector input from connection
  const getVectorInput = (socketName: string, defaultValue: Vec3 = { x: 0, y: 0, z: 0 }): Vec3 => {
    const conn = connections.find(
      (c) => c.toNode === node.id && c.toSocket === socketName
    );
    if (!conn) return defaultValue;

    const sourceNode = nodes.find((n) => n.id === conn.fromNode);
    if (!sourceNode) return defaultValue;

    return evaluateNodeVector(sourceNode, nodes, connections, u, v, time);
  };

  switch (node.type) {
    case NodeType.TIME: {
      const speed = node.data.speed ?? 1.0;
      result = time * speed;
      break;
    }

    case NodeType.VALUE: {
      result = node.data.value ?? 0;
      break;
    }

    case NodeType.VECTOR: {
      // Return the first component (x) for scalar context
      result = node.data.x ?? 0;
      break;
    }

    case NodeType.POSITION: {
      // Return U coordinate as scalar (for compatibility)
      result = u * GRID_WORLD_SIZE;
      break;
    }

    case NodeType.COMBINE_XYZ: {
      // Combine XYZ returns x component as scalar
      const x = getInput('x', node.data.x ?? 0);
      result = x;
      break;
    }

    case NodeType.SEPARATE_XYZ: {
      // Separate XYZ - evaluate vector input and return x component
      const vec = getVectorInput('vector', { x: 0, y: 0, z: 0 });
      result = vec.x;
      break;
    }

    case NodeType.MATH: {
      const a = getInput('a', 0);
      const b = getInput('b', node.data.value ?? 0);
      const op = node.data.op ?? 'ADD';

      switch (op) {
        case 'ADD':
          result = a + b;
          break;
        case 'SUB':
          result = a - b;
          break;
        case 'MUL':
          result = a * b;
          break;
        case 'DIV':
          result = b !== 0 ? a / b : 0;
          break;
        case 'MIN':
          result = Math.min(a, b);
          break;
        case 'MAX':
          result = Math.max(a, b);
          break;
        case 'SIN':
          result = Math.sin(a);
          break;
        case 'COS':
          result = Math.cos(a);
          break;
      }
      break;
    }

    case NodeType.VECTOR_MATH: {
      const a = getVectorInput('a', { x: 0, y: 0, z: 0 });
      const b = getVectorInput('b', { x: 0, y: 0, z: 0 });
      const op = node.data.vectorOp ?? 'ADD';
      const scale = node.data.scale ?? 1.0;
      const opResult = vectorMathOp(op, a, b, scale);

      // If result is scalar, return it directly
      if (typeof opResult === 'number') {
        result = opResult;
      } else {
        // For vector results, return length as scalar
        result = Math.sqrt(opResult.x ** 2 + opResult.y ** 2 + opResult.z ** 2);
      }
      break;
    }

    case NodeType.WAVE_TEXTURE: {
      // Get vector input or use UV coordinates
      const vecInput = getVectorInput('vector', { x: -1, y: -1, z: -1 });
      let worldX: number, worldY: number;

      if (vecInput.x === -1 && vecInput.y === -1) {
        // No vector input, use UV coordinates
        worldX = u * GRID_WORLD_SIZE + 5;
        worldY = v * GRID_WORLD_SIZE + 5;
      } else {
        worldX = vecInput.x;
        worldY = vecInput.y;
      }

      const waveType = node.data.waveType ?? 'BANDS';
      const direction = node.data.direction ?? 'X';
      const profile = node.data.profile ?? 'SINE';
      const waveScale = node.data.waveScale ?? 0.5;
      const distortion = node.data.distortion ?? 0;
      const detail = node.data.detail ?? 0;
      const detailScale = node.data.detailScale ?? 0;
      const detailRoughness = node.data.detailRoughness ?? 0;
      const phase = getInput('phase', 0);

      // Calculate base wave value based on type and direction
      let waveValue: number;
      if (waveType === 'BANDS') {
        // Band wave: based on direction
        switch (direction) {
          case 'X':
            waveValue = worldX * waveScale + phase;
            break;
          case 'Y':
            waveValue = worldY * waveScale + phase;
            break;
          case 'Z':
            waveValue = 0 * waveScale + phase; // Z is 0 for 2D
            break;
          case 'DIAGONAL':
            waveValue = (worldX + worldY) * waveScale * 0.707 + phase;
            break;
          default:
            waveValue = worldX * waveScale + phase;
        }
      } else {
        // Ring wave: based on distance from center
        const dx = worldX - 5;
        const dy = worldY - 5;
        const dist = Math.sqrt(dx * dx + dy * dy);
        waveValue = dist * waveScale + phase;
      }

      // Add distortion using noise
      const distortNoise = noise.noise3D(worldX * 0.5, worldY * 0.5, time * 0.1);
      waveValue += distortNoise * distortion;

      // Add detail using higher frequency noise
      const detailNoise = noise.noise3D(
        worldX * detailScale * 0.1,
        worldY * detailScale * 0.1,
        time * 0.1
      );
      waveValue += detailNoise * detail * detailRoughness;

      // Apply wave profile
      if (profile === 'SINE') {
        result = (Math.sin(waveValue * Math.PI * 2) + 1) * 0.5;
      } else {
        // SAW profile
        const sawVal = waveValue - Math.floor(waveValue);
        result = sawVal;
      }
      break;
    }

    case NodeType.NOISE_TEXTURE: {
      // Get vector input or use UV coordinates
      const vecInput = getVectorInput('vector', { x: -1, y: -1, z: -1 });
      let worldX: number, worldY: number;

      if (vecInput.x === -1 && vecInput.y === -1) {
        worldX = u * GRID_WORLD_SIZE;
        worldY = v * GRID_WORLD_SIZE;
      } else {
        worldX = vecInput.x;
        worldY = vecInput.y;
      }

      const noiseScale = node.data.noiseScale ?? 5.0;

      const n = noise.noise3D(
        worldX * noiseScale * 0.1,
        worldY * noiseScale * 0.1,
        time * 0.1
      );

      result = (n + 1) * 0.5;
      break;
    }

    case NodeType.OUTPUT: {
      result = getInput('value', 0);
      break;
    }
  }

  evalCache.set(cacheKey, result);
  return result;
}

// Evaluate a single node - returns vector value
function evaluateNodeVector(
  node: Node,
  nodes: Node[],
  connections: Connection[],
  u: number,
  v: number,
  time: number
): Vec3 {
  const cacheKey = `vec-${node.id}-${u.toFixed(4)}-${v.toFixed(4)}-${time.toFixed(4)}`;
  if (evalVectorCache.has(cacheKey)) {
    return evalVectorCache.get(cacheKey)!;
  }

  let result: Vec3 = { x: 0, y: 0, z: 0 };

  // Get vector input from connection
  const getVectorInput = (socketName: string, defaultValue: Vec3 = { x: 0, y: 0, z: 0 }): Vec3 => {
    const conn = connections.find(
      (c) => c.toNode === node.id && c.toSocket === socketName
    );
    if (!conn) return defaultValue;

    const sourceNode = nodes.find((n) => n.id === conn.fromNode);
    if (!sourceNode) return defaultValue;

    return evaluateNodeVector(sourceNode, nodes, connections, u, v, time);
  };

  switch (node.type) {
    case NodeType.VECTOR: {
      result = {
        x: node.data.x ?? 0,
        y: node.data.y ?? 0,
        z: node.data.z ?? 0,
      };
      break;
    }

    case NodeType.VECTOR_MATH: {
      const a = getVectorInput('a', { x: 0, y: 0, z: 0 });
      const b = getVectorInput('b', { x: 0, y: 0, z: 0 });
      const op = node.data.vectorOp ?? 'ADD';
      const scale = node.data.scale ?? 1.0;
      const opResult = vectorMathOp(op, a, b, scale);

      if (typeof opResult === 'number') {
        // Scalar result, convert to vector
        result = { x: opResult, y: opResult, z: opResult };
      } else {
        result = opResult;
      }
      break;
    }

    case NodeType.VALUE: {
      const val = node.data.value ?? 0;
      result = { x: val, y: val, z: val };
      break;
    }

    case NodeType.POSITION: {
      // Return world coordinates as vector
      result = {
        x: u * GRID_WORLD_SIZE,
        y: v * GRID_WORLD_SIZE,
        z: 0,
      };
      break;
    }

    case NodeType.COMBINE_XYZ: {
      // Get scalar inputs for each axis
      const getInput = (socketName: string, defaultValue: number): number => {
        const conn = connections.find(
          (c) => c.toNode === node.id && c.toSocket === socketName
        );
        if (!conn) return defaultValue;
        const sourceNode = nodes.find((n) => n.id === conn.fromNode);
        if (!sourceNode) return defaultValue;
        return evaluateNode(sourceNode, nodes, connections, u, v, time);
      };

      result = {
        x: getInput('x', node.data.x ?? 0),
        y: getInput('y', node.data.y ?? 0),
        z: getInput('z', node.data.z ?? 0),
      };
      break;
    }

    case NodeType.SEPARATE_XYZ: {
      // Get vector input and separate
      const vec = getVectorInput('vector', { x: 0, y: 0, z: 0 });
      result = vec;
      break;
    }

    default: {
      // For other nodes, evaluate scalar and return as vector
      const scalar = evaluateNode(node, nodes, connections, u, v, time);
      result = { x: scalar, y: scalar, z: scalar };
    }
  }

  evalVectorCache.set(cacheKey, result);
  return result;
}

// Evaluate the entire graph at a specific UV coordinate
export function evaluateGraph(
  nodes: Node[],
  connections: Connection[],
  u: number,
  v: number,
  time: number
): number {
  // Clear caches for new evaluation
  evalCache.clear();
  evalVectorCache.clear();

  // Find output node
  const outputNode = nodes.find((n) => n.type === NodeType.OUTPUT);
  if (!outputNode) return 0;

  return evaluateNode(outputNode, nodes, connections, u, v, time);
}

// Evaluate the entire grid and return height values
export function evaluateGridHeights(
  nodes: Node[],
  connections: Connection[],
  gridSize: number,
  time: number
): Float32Array {
  const heights = new Float32Array(gridSize * gridSize);

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const u = i / (gridSize - 1);
      const v = j / (gridSize - 1);
      const value = evaluateGraph(nodes, connections, u, v, time);
      heights[i * gridSize + j] = Math.max(0, Math.min(1, value));
    }
  }

  return heights;
}
