import { Node, Connection, NodeType, MathOp, VectorMathOp, WaveType, WaveDirection, WaveProfile } from '../types';

// Helper to generate unique variable names
function getVarName(nodeId: string, socket: string): string {
  return `v_${nodeId.replace(/-/g, '_')}_${socket}`;
}

// Helper to format float for GLSL (e.g., 1 -> 1.0)
function floatStr(num: number): string {
  if (Number.isInteger(num)) return `${num}.0`;
  return num.toString();
}

// GLSL Noise Functions
const NOISE_GLSL = `
// Simplex 3D Noise 
// by Ian McEwan, Ashima Arts
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// Constants
const float PI = 3.14159265359;
`;

export function generateFragmentShader(nodes: Node[], connections: Connection[], options?: { useWorldPos?: boolean }): string {
  const visited = new Set<string>();
  const codeLines: string[] = [];
  
  // Find output node
  const outputNode = nodes.find(n => n.type === NodeType.OUTPUT);
  if (!outputNode) {
    return 'void main() { gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); }'; // Error color
  }

  // Recursive function to generate code for a node
  function traverse(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    // First ensure dependencies are generated
    // (We iterate backwards from current node inputs)
    
    // Helper to get input variable name or default value
    const getInput = (socketName: string, type: 'float' | 'vec3'): string => {
      // Find connection to this socket
      const connection = connections.find(c => c.toNode === nodeId && c.toSocket === socketName);
      if (connection) {
        // Recurse to dependency
        traverse(connection.fromNode);
        return getVarName(connection.fromNode, connection.fromSocket);
      }
      
      // Default values if not connected
      if (type === 'float') return '0.0';
      if (type === 'vec3') return 'vec3(0.0)';
      return '0.0';
    };

    // Generate code for this node type
    switch (node.type) {
      case NodeType.TIME:
        // Output: value (float)
        // uniform uTime is already scaled by speed in the simulation loop (TextureCanvas/ReliefGrid)
        // so we just return it directly to avoid double multiplication (speed * speed).
        codeLines.push(`  float ${getVarName(nodeId, 'value')} = uTime;`);
        break;

      case NodeType.VALUE:
        codeLines.push(`  float ${getVarName(nodeId, 'value')} = ${floatStr(node.data.value ?? 0.0)};`);
        break;

      case NodeType.PARAMETER:
        // Use 'value' field as current value (acts same as VALUE node in single render)
        // For GridPreview, we will override this node's 'value' in the node data before generation.
        codeLines.push(`  float ${getVarName(nodeId, 'value')} = ${floatStr(node.data.value ?? 0.0)};`);
        break;


      case NodeType.VECTOR:
        const x = floatStr(node.data.x ?? 0);
        const y = floatStr(node.data.y ?? 0);
        const z = floatStr(node.data.z ?? 0);
        codeLines.push(`  vec3 ${getVarName(nodeId, 'vector')} = vec3(${x}, ${y}, ${z});`);
        break;

      case NodeType.POSITION:
        // Position comes from vUv uniform scaled by grid, centered to move origin to middle
        if (options?.useWorldPos) {
             codeLines.push(`  vec3 ${getVarName(nodeId, 'vector')} = vPos;`);
        } else {
             codeLines.push(`  vec3 ${getVarName(nodeId, 'vector')} = vec3((vUv - 0.5) * uGridSize, 0.0);`);
        }
        break;

      case NodeType.COMBINE_XYZ: {
        const cx = getInput('x', 'float');
        const cy = getInput('y', 'float');
        const cz = getInput('z', 'float');
        // If not connected, use initialData, but getInput returns 0.0. 
        // We should merge manual Input with Connection.
        // For simplicity: if NOT connected, use data.
        
        const safeInput = (socket: 'x'|'y'|'z') => {
            const conn = connections.find(c => c.toNode === nodeId && c.toSocket === socket);
            if (conn) {
                traverse(conn.fromNode);
                return getVarName(conn.fromNode, conn.fromSocket);
            }
            return floatStr(node.data[socket] ?? 0);
        };

        codeLines.push(`  vec3 ${getVarName(nodeId, 'vector')} = vec3(${safeInput('x')}, ${safeInput('y')}, ${safeInput('z')});`);
        break;
      }

      case NodeType.SEPARATE_XYZ: {
        const inputVec = getInput('vector', 'vec3');
        const baseVar = getVarName(nodeId, 'vector'); // Virtual base var to access components easier? 
        // Actually we produce 3 separate outputs
        codeLines.push(`  vec3 ${baseVar} = ${inputVec};`);
        codeLines.push(`  float ${getVarName(nodeId, 'x')} = ${baseVar}.x;`);
        codeLines.push(`  float ${getVarName(nodeId, 'y')} = ${baseVar}.y;`);
        codeLines.push(`  float ${getVarName(nodeId, 'z')} = ${baseVar}.z;`);
        break;
      }

      case NodeType.MATH: {
        const a = connections.find(c => c.toNode === nodeId && c.toSocket === 'a') 
            ? getInput('a', 'float') 
            : floatStr(node.data.value ?? 0); // Math node can have value for "unset" inputs? No, types.ts says Math node uses inputs a,b.
        const b = getInput('b', 'float'); // Usually b is second op. For internal value, it might be in data? 
                                          // Let's assume strict connections or 0.0 for now, except specific ops.
                                          // Note: In Blender, disconnected sockets have default values inside the node.
                                          // Our type definition has `value`? No, NodeData has `value` only for VALUE node.
                                          // Wait, Scene.tsx evaluated 'b' from node.data.value?? 
                                          // "const b = bConn ? ... : (node.data.value ?? 0);" 
                                          // Let's support that behavior.
        
        const bInput = connections.find(c => c.toNode === nodeId && c.toSocket === 'b')
            ? getInput('b', 'float')
            : floatStr(node.data.value ?? 0);

        const op = node.data.op || 'ADD';
        const outVar = getVarName(nodeId, 'value');
        let expr = '';

        // Safely handle A for consistency if needed, though usually A is connected.
        // If A not connected, default 0.

        switch (op) {
          case 'ADD': expr = `${a} + ${bInput}`; break;
          case 'SUB': expr = `${a} - ${bInput}`; break;
          case 'MUL': expr = `${a} * ${bInput}`; break;
          case 'DIV': expr = `${bInput} != 0.0 ? ${a} / ${bInput} : 0.0`; break;
          case 'SIN': expr = `sin(${a})`; break;
          case 'COS': expr = `cos(${a})`; break;
          case 'TAN': expr = `tan(${a})`; break;
          case 'MIN': expr = `min(${a}, ${bInput})`; break;
          case 'MAX': expr = `max(${a}, ${bInput})`; break;
          case 'POWER': expr = `pow(${a}, ${bInput})`; break;
          case 'SQRT': expr = `${a} >= 0.0 ? sqrt(${a}) : 0.0`; break;
          case 'ABSOLUTE': expr = `abs(${a})`; break;
          case 'FLOOR': expr = `floor(${a})`; break;
          case 'CEIL': expr = `ceil(${a})`; break;
          case 'ROUND': expr = `floor(${a} + 0.5)`; break;
          case 'FRACT': expr = `fract(${a})`; break;
          case 'MODULO': expr = `mod(${a}, ${bInput})`; break;
          case 'SIGN': expr = `sign(${a})`; break;
          case 'PINGPONG': expr = `( ${bInput} != 0.0 ? (abs(fract((${a} - ${bInput}) / (2.0 * ${bInput})) * 2.0 - 1.0) * ${bInput}) : 0.0 )`; break; // Simplified PingPong
          case 'SMOOTH_MIN': {
              // Smooth min (polynomial)
              // float h = max(k - abs(a-b), 0.0) / k;
              // return min(a, b) - h*h*k * (1.0/4.0);
              // Using bInput as 'b', and we need a 'k'? Usually math node doesn't have k. 
              // Blender Smooth Min uses Distance. 
              // Let's implement standard min for now if simplified.
              expr = `min(${a}, ${bInput})`; 
              break;
          }
           // Add more advanced math functions here
          default: expr = `${a} + ${bInput}`; break;
        }
        codeLines.push(`  float ${outVar} = ${expr};`);
        break;
      }

      case NodeType.VECTOR_MATH: {
        // Helper to get input with automatic float->vec3 conversion
        const getVec3Input = (socket: string): string => {
          const conn = connections.find(c => c.toNode === nodeId && c.toSocket === socket);
          if (!conn) return 'vec3(0.0)';
          
          // Check source node type to determine output type
          const sourceNode = nodes.find(n => n.id === conn.fromNode);
          if (sourceNode) {
            // These node types output floats
            const floatOutputTypes = [NodeType.TIME, NodeType.VALUE, NodeType.PARAMETER, NodeType.MATH];
            const floatOutputSockets = ['value', 'x', 'y', 'z']; // Sockets that output float
            
            if (floatOutputTypes.includes(sourceNode.type) || floatOutputSockets.includes(conn.fromSocket)) {
              // Source outputs float, wrap in vec3
              traverse(conn.fromNode);
              const floatVar = getVarName(conn.fromNode, conn.fromSocket);
              return `vec3(${floatVar})`;
            }
          }
          
          // Default: assume vec3 output
          return getInput(socket, 'vec3');
        };

        const a = getVec3Input('a');
        const b = getVec3Input('b');
        
        const op = node.data.vectorOp || 'ADD';
        const scaleVal = floatStr(node.data.scale ?? 1.0);
        
        const outVec = getVarName(nodeId, 'vector');
        const outVal = getVarName(nodeId, 'value');
        
        let vecExpr = 'vec3(0.0)';
        let valExpr = '0.0';

        switch(op) {
            // Basic Operations
            case 'ADD': vecExpr = `${a} + ${b}`; break;
            case 'SUBTRACT': vecExpr = `${a} - ${b}`; break;
            case 'MULTIPLY': vecExpr = `${a} * ${b}`; break;
            case 'DIVIDE': vecExpr = `${a} / (${b} + 0.0001)`; break; // Avoid div by zero
            case 'MULTIPLY_ADD': { 
                const c = connections.find(conn => conn.toNode === nodeId && conn.toSocket === 'c')
                    ? getInput('c', 'vec3') : 'vec3(0.0)';
                vecExpr = `${a} * ${b} + ${c}`; 
                break;
            }
            case 'SCALE': {
                // SCALE: a * scale_factor
                // If B is connected, use its X component as scale. Otherwise use node.data.scale.
                const bConn = connections.find(c => c.toNode === nodeId && c.toSocket === 'b');
                const scaleExpr = bConn ? `${b}.x` : floatStr(node.data.scale ?? 1.0);
                vecExpr = `${a} * ${scaleExpr}`;
                break;
            }

            // Vector Operations
            case 'CROSS_PRODUCT': vecExpr = `cross(${a}, ${b})`; break;
            case 'PROJECT': vecExpr = `dot(${a}, ${b}) / (dot(${b}, ${b}) + 0.0001) * ${b}`; break;
            case 'REFLECT': vecExpr = `reflect(${a}, normalize(${b}))`; break;
            case 'REFRACT': vecExpr = `refract(normalize(${a}), normalize(${b}), 1.0)`; break;
            case 'FACEFORWARD': vecExpr = `faceforward(${a}, ${b}, ${b})`; break;
            case 'DOT_PRODUCT': valExpr = `dot(${a}, ${b})`; break;
            case 'DISTANCE': valExpr = `distance(${a}, ${b})`; break;
            case 'LENGTH': valExpr = `length(${a})`; break;
            case 'NORMALIZE': vecExpr = `normalize(${a})`; break;

            // Math Operations
            case 'ABSOLUTE': vecExpr = `abs(${a})`; break;
            case 'POWER': vecExpr = `pow(${a}, ${b})`; break;
            case 'SIGN': vecExpr = `sign(${a})`; break;
            case 'MINIMUM': vecExpr = `min(${a}, ${b})`; break;
            case 'MAXIMUM': vecExpr = `max(${a}, ${b})`; break;
            case 'FLOOR': vecExpr = `floor(${a})`; break;
            case 'CEIL': vecExpr = `ceil(${a})`; break;
            case 'FRACTION': vecExpr = `fract(${a})`; break;
            case 'MODULO': vecExpr = `mod(${a}, ${b} + 0.0001)`; break;
            case 'WRAP': vecExpr = `mod(${a} - ${b}, vec3(1.0)) + ${b}`; break; // Wrap between min(b) and max(1)
            case 'SNAP': vecExpr = `floor(${a} / (${b} + 0.0001)) * ${b}`; break; // Snap to increments

            // Trigonometry
            case 'SINE': vecExpr = `sin(${a})`; break; 
            case 'COSINE': vecExpr = `cos(${a})`; break;
            case 'TANGENT': vecExpr = `tan(${a})`; break;

            default: vecExpr = `${a} + ${b}`; break;
        }
        
        codeLines.push(`  vec3 ${outVec} = ${vecExpr};`);
        codeLines.push(`  float ${outVal} = ${valExpr};`);
        break;
      }

      case NodeType.WAVE_TEXTURE: {
        const vector = connections.find(c => c.toNode === nodeId && c.toSocket === 'vector')
             ? getInput('vector', 'vec3')
             : (options?.useWorldPos ? `vPos` : `vec3((vUv - 0.5) * uGridSize, 0.0)`);
        
        const phase = connections.find(c => c.toNode === nodeId && c.toSocket === 'phase')
             ? getInput('phase', 'float')
             : '0.0';

        const scale = connections.find(c => c.toNode === nodeId && c.toSocket === 'scale')
             ? getInput('scale', 'float')
             : floatStr(node.data.waveScale ?? 0.5);

        const dist = connections.find(c => c.toNode === nodeId && c.toSocket === 'distortion')
             ? getInput('distortion', 'float')
             : floatStr(node.data.distortion ?? 0.0);
        const detail = Math.max(0, Math.min(10, Math.floor(node.data.detail ?? 0)));
        // Unused vars removed or commented to avoid TS unused warning if stricter
        // const detailScale = floatStr(node.data.detailScale ?? 0.0);
        // const detailRough = floatStr(node.data.detailRoughness ?? 0.0);

        const outVar = getVarName(nodeId, 'value');
        
        // Generate Wave Code inline or via helper function
        // We can just inline the logic here since we are generating
        
        const type = node.data.waveType || 'BANDS';
        const direction = node.data.direction || 'X';
        const profile = node.data.profile || 'SINE';
        
        let coordSelect = '';
        if (type === 'BANDS') {
             if (direction === 'X') coordSelect = `${vector}.x`;
             else if (direction === 'Y') coordSelect = `${vector}.y`;
             else if (direction === 'Z') coordSelect = `${vector}.z`; // Z is usually 0 for 2D plane unless displaced
             else if (direction === 'DIAGONAL') coordSelect = `(${vector}.x + ${vector}.y) * 0.707`;
        } else {
            // RINGS
            // Center is usually 0,0 in local coords, but here we use world coords.
            // Let's assume center is based on grid?? Or just distance from origin (0,0)?
            // Blender Rings are spherical from origin.
             if (direction === 'X') coordSelect = `length(vec3(${vector}.x, ${vector}.y, ${vector}.z))`; // Spherical
             else coordSelect = `length(${vector})`;
        }
        
        // Distortion
        codeLines.push(`  float ${outVar}_msg = ${coordSelect} * ${scale} + ${phase};`);
        
        // Detailed Distortion (fBm like)
        if (node.data.distortion !== 0 || connections.find(c => c.toNode === nodeId && c.toSocket === 'distortion')) {
             let distCode = `snoise(${vector} * 0.5)`; // Base
             
             if (detail > 0) {
                 codeLines.push(`  float ${outVar}_noise = 0.0;`);
                 codeLines.push(`  float ${outVar}_amp = 1.0;`);
                 codeLines.push(`  float ${outVar}_freq = 1.0;`);
                 codeLines.push(`  ${outVar}_noise += snoise(${vector}) * ${outVar}_amp;`);
                 
                 for(let i=0; i<Math.min(detail, 5); i++) {
                     const loopScale = node.data.detailScale || 2.0;
                     const loopRough = node.data.detailRoughness || 0.5;
                     
                     codeLines.push(`  ${outVar}_freq *= ${floatStr(loopScale)};`);
                     codeLines.push(`  ${outVar}_amp *= ${floatStr(loopRough)};`);
                     codeLines.push(`  ${outVar}_noise += snoise(${vector} * ${outVar}_freq) * ${outVar}_amp;`);
                 }
                 distCode = `${outVar}_noise`;
             }
             codeLines.push(`  ${outVar}_msg += ${distCode} * ${dist};`);
        }
        
        let finalCalc = '';
        if (profile === 'SINE') {
            finalCalc = `0.5 * (sin(${outVar}_msg * 6.2831855) + 1.0)`;
        } else {
            finalCalc = `fract(${outVar}_msg)`;
        }
        
        codeLines.push(`  float ${outVar} = ${finalCalc};`);
        break;
      }
      
      case NodeType.NOISE_TEXTURE: {
        const vector = connections.find(c => c.toNode === nodeId && c.toSocket === 'vector')
             ? getInput('vector', 'vec3')
             : (options?.useWorldPos ? `vPos` : `vec3((vUv - 0.5) * uGridSize, 0.0)`);
        
        const scale = connections.find(c => c.toNode === nodeId && c.toSocket === 'scale')
             ? getInput('scale', 'float')
             : floatStr(node.data.noiseScale ?? 5.0);

        const outVar = getVarName(nodeId, 'value');
        codeLines.push(`  float ${outVar} = snoise(${vector} * ${scale}) * 0.5 + 0.5;`);
        break;
      }
    }
  }

  // Start generation from output
  const outputConnection = connections.find(c => c.toNode === outputNode.id && c.toSocket === 'value');
  
  if (outputConnection) {
      traverse(outputConnection.fromNode);
      const finalVar = getVarName(outputConnection.fromNode, outputConnection.fromSocket);
      codeLines.push(`  float finalValue = ${finalVar};`);
  } else {
      codeLines.push(`  float finalValue = 0.0;`);
  }

  // Final shader assembly
  return `
    precision highp float;
    uniform float uTime;
    uniform float uGridSize;
    varying vec2 vUv;
    ${options?.useWorldPos ? 'varying vec3 vPos;' : ''}
    
    ${NOISE_GLSL}

    void main() {
      // Generated Code
      ${codeLines.join('\n      ')}

      // Tone mappings / Clamping
      finalValue = clamp(finalValue, 0.0, 1.0);
      gl_FragColor = vec4(vec3(finalValue), 1.0);
    }
  `;
}
