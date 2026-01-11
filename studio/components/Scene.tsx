import React, { useLayoutEffect, useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  ContactShadows,
} from '@react-three/drei';
import * as THREE from 'three';
import { Node, Connection, NodeType, GRID_SIZE, GRID_WORLD_SIZE, ColorRampStop, DEFAULT_COLOR_RAMP_STOPS } from '../types';
import { Download, Play, Pause, RotateCcw, X, Eye } from 'lucide-react';

// GLSL noise functions (shared)
const noiseGLSL = `
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
`;

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  ${noiseGLSL}

  uniform float uTime;
  uniform int uWaveType;       // 0: BANDS, 1: RINGS
  uniform int uDirection;      // 0: X, 1: Y, 2: Z, 3: DIAGONAL
  uniform int uProfile;        // 0: SINE, 1: SAW
  uniform float uWaveScale;
  uniform float uDistortion;
  uniform float uDetail;
  uniform float uDetailScale;
  uniform float uDetailRoughness;
  uniform float uPhaseSpeed;
  uniform float uGridSize;
  uniform float uOffsetX;
  uniform float uOffsetY;

  varying vec2 vUv;

  void main() {
    vec2 worldPos = vUv * uGridSize + vec2(uOffsetX, uOffsetY);
    float phase = uTime * uPhaseSpeed;

    float waveValue;
    if (uWaveType == 0) {
      // BANDS
      if (uDirection == 0) {
        waveValue = worldPos.x * uWaveScale + phase;
      } else if (uDirection == 1) {
        waveValue = worldPos.y * uWaveScale + phase;
      } else if (uDirection == 3) {
        waveValue = (worldPos.x + worldPos.y) * uWaveScale * 0.707 + phase;
      } else {
        waveValue = worldPos.x * uWaveScale + phase;
      }
    } else {
      // RINGS
      vec2 center = vec2(uGridSize * 0.5);
      float dist = length(worldPos - center);
      waveValue = dist * uWaveScale + phase;
    }

    // Distortion noise
    float distortNoise = snoise(vec3(worldPos * 0.5, uTime * 0.1));
    waveValue += distortNoise * uDistortion;

    // Detail noise
    float detailNoise = snoise(vec3(worldPos * uDetailScale * 0.1, uTime * 0.1));
    waveValue += detailNoise * uDetail * uDetailRoughness;

    // Apply profile
    float result;
    if (uProfile == 0) {
      result = (sin(waveValue * 3.14159265 * 2.0) + 1.0) * 0.5;
    } else {
      result = fract(waveValue);
    }

    result = clamp(result, 0.0, 1.0);
    gl_FragColor = vec4(vec3(result), 1.0);
  }
`;

// Helper to extract wave params from nodes
function extractWaveParams(nodes: Node[]) {
  const waveNode = nodes.find(n => n.type === NodeType.WAVE_TEXTURE);
  const timeNode = nodes.find(n => n.type === NodeType.TIME);
  const positionNode = nodes.find(n => n.type === NodeType.POSITION);
  const vectorMathNode = nodes.find(n => n.type === NodeType.VECTOR_MATH);
  const vectorNode = nodes.find(n => n.type === NodeType.VECTOR);

  const waveTypeMap: Record<string, number> = { 'BANDS': 0, 'RINGS': 1 };
  const directionMap: Record<string, number> = { 'X': 0, 'Y': 1, 'Z': 2, 'DIAGONAL': 3 };
  const profileMap: Record<string, number> = { 'SINE': 0, 'SAW': 1 };

  // Check if there's a vector offset (Position + Vector via VectorMath)
  let offsetX = 0, offsetY = 0;
  if (vectorMathNode && vectorNode) {
    const op = vectorMathNode.data.vectorOp;
    if (op === 'ADD') {
      offsetX = vectorNode.data.x ?? 0;
      offsetY = vectorNode.data.y ?? 0;
    } else if (op === 'SUBTRACT') {
      offsetX = -(vectorNode.data.x ?? 0);
      offsetY = -(vectorNode.data.y ?? 0);
    }
  }

  return {
    waveType: waveTypeMap[waveNode?.data.waveType ?? 'BANDS'] ?? 0,
    direction: directionMap[waveNode?.data.direction ?? 'X'] ?? 0,
    profile: profileMap[waveNode?.data.profile ?? 'SINE'] ?? 0,
    waveScale: waveNode?.data.waveScale ?? 0.5,
    distortion: waveNode?.data.distortion ?? 0,
    detail: waveNode?.data.detail ?? 0,
    detailScale: waveNode?.data.detailScale ?? 0,
    detailRoughness: waveNode?.data.detailRoughness ?? 0,
    phaseSpeed: timeNode?.data.speed ?? 1.0,
    offsetX,
    offsetY,
  };
}

// GPU Heightmap generator - renders to a texture and reads back pixels
class GPUHeightmapGenerator {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private material: THREE.ShaderMaterial;
  private renderTarget: THREE.WebGLRenderTarget;
  private pixelBuffer: Uint8Array;
  private size: number;

  constructor(size: number) {
    this.size = size;
    this.pixelBuffer = new Uint8Array(size * size * 4);

    // Create offscreen renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: false });
    this.renderer.setSize(size, size);

    // Orthographic camera looking at XY plane
    this.camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
    this.camera.position.z = 1;

    // Scene with fullscreen quad
    this.scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(1, 1);

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uWaveType: { value: 0 },
        uDirection: { value: 0 },
        uProfile: { value: 0 },
        uWaveScale: { value: 0.5 },
        uDistortion: { value: 0 },
        uDetail: { value: 0 },
        uDetailScale: { value: 0 },
        uDetailRoughness: { value: 0 },
        uPhaseSpeed: { value: 1.0 },
        uGridSize: { value: GRID_WORLD_SIZE },
        uOffsetX: { value: 0 },
        uOffsetY: { value: 0 },
      },
    });

    const mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(mesh);

    // Render target for reading pixels
    this.renderTarget = new THREE.WebGLRenderTarget(size, size, {
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
    });
  }

  updateParams(params: ReturnType<typeof extractWaveParams>, time: number) {
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uWaveType.value = params.waveType;
    this.material.uniforms.uDirection.value = params.direction;
    this.material.uniforms.uProfile.value = params.profile;
    this.material.uniforms.uWaveScale.value = params.waveScale;
    this.material.uniforms.uDistortion.value = params.distortion;
    this.material.uniforms.uDetail.value = params.detail;
    this.material.uniforms.uDetailScale.value = params.detailScale;
    this.material.uniforms.uDetailRoughness.value = params.detailRoughness;
    this.material.uniforms.uPhaseSpeed.value = params.phaseSpeed;
    this.material.uniforms.uOffsetX.value = params.offsetX;
    this.material.uniforms.uOffsetY.value = params.offsetY;
  }

  render(): Uint8Array {
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.scene, this.camera);
    this.renderer.readRenderTargetPixels(
      this.renderTarget, 0, 0, this.size, this.size, this.pixelBuffer
    );
    this.renderer.setRenderTarget(null);
    return this.pixelBuffer;
  }

  getHeightAt(i: number, j: number): number {
    const idx = (j * this.size + i) * 4;
    return this.pixelBuffer[idx] / 255;
  }

  dispose() {
    this.renderer.dispose();
    this.renderTarget.dispose();
    this.material.dispose();
  }
}

interface SceneProps {
  nodes: Node[];
  connections: Connection[];
}

const tempObject = new THREE.Object3D();

interface ReliefGridProps extends SceneProps {
  setExportFn: (fn: () => void) => void;
  paused: boolean;
  colorRampStops: ColorRampStop[];
  grayscaleMode: boolean;
}

const ReliefGrid: React.FC<ReliefGridProps> = ({
  nodes,
  connections,
  setExportFn,
  paused,
  colorRampStops,
  grayscaleMode,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRefs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const timeRef = useRef(0);
  const gpuGeneratorRef = useRef<GPUHeightmapGenerator | null>(null);
  const texturePlaneRef = useRef<THREE.Mesh>(null);

  // Initialize GPU generator for layer heightmap
  useEffect(() => {
    gpuGeneratorRef.current = new GPUHeightmapGenerator(GRID_SIZE);
    return () => {
      gpuGeneratorRef.current?.dispose();
    };
  }, []);

  // Sort stops and get thresholds
  const sortedStops = useMemo(() =>
    [...colorRampStops].sort((a, b) => a.position - b.position),
    [colorRampStops]
  );

  const colorObjects = useMemo(
    () => sortedStops.map((s) => new THREE.Color(s.color)),
    [sortedStops]
  );

  // Register export function
  useLayoutEffect(() => {
    setExportFn(() => {
      const currentTime = timeRef.current;
      const numLayers = sortedStops.length;

      // Generate OBJ content
      let objContent = '# PatternFlow Relief Export\n';
      objContent += '# Blender Compatible\n';
      objContent += `# Grid Size: ${GRID_WORLD_SIZE}x${GRID_WORLD_SIZE}\n`;
      objContent += `# Resolution: ${GRID_SIZE}x${GRID_SIZE}\n`;
      objContent += `# Layers: ${numLayers}\n\n`;
      objContent += 'mtllib model.mtl\n\n';

      // Generate MTL content
      let mtlContent = '# PatternFlow Materials\n\n';
      sortedStops.forEach((stop, i) => {
        const c = new THREE.Color(stop.color);
        mtlContent += `newmtl Material_${i + 1}\n`;
        mtlContent += `Kd ${c.r.toFixed(4)} ${c.g.toFixed(4)} ${c.b.toFixed(4)}\n`;
        mtlContent += `d 1.0\n`;
        mtlContent += `illum 2\n\n`;
      });

      // Calculate cell size
      const cellSize = GRID_WORLD_SIZE / GRID_SIZE;
      const offset = GRID_WORLD_SIZE / 2;

      let vertexIndex = 1;
      const layerVertices: string[][] = sortedStops.map(() => []);
      const layerFaces: string[][] = sortedStops.map(() => []);

      // Generate geometry for each cell
      for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
          const u = i / (GRID_SIZE - 1);
          const v = j / (GRID_SIZE - 1);

          let val = evaluateGraph(nodes, connections, u, v, currentTime);
          val = Math.max(0, Math.min(1, val));

          const x = i * cellSize - offset;
          const z = j * cellSize - offset;

          // Determine which layers should exist
          // Higher value = more layers stacked
          sortedStops.forEach((stop, layerIdx) => {
            // Layer 0 (base) always exists
            // Higher layers exist if value >= stop position
            const shouldExist = layerIdx === 0 || val >= stop.position;
            if (!shouldExist) return;

            const y = layerIdx * cellSize;
            const halfSize = cellSize / 2;

            // 8 vertices of the box
            const verts = [
              [x - halfSize, y, z - halfSize],
              [x + halfSize, y, z - halfSize],
              [x + halfSize, y, z + halfSize],
              [x - halfSize, y, z + halfSize],
              [x - halfSize, y + cellSize, z - halfSize],
              [x + halfSize, y + cellSize, z - halfSize],
              [x + halfSize, y + cellSize, z + halfSize],
              [x - halfSize, y + cellSize, z + halfSize],
            ];

            verts.forEach((vert) => {
              layerVertices[layerIdx].push(
                `v ${vert[0].toFixed(4)} ${vert[1].toFixed(4)} ${vert[2].toFixed(4)}`
              );
            });

            // 6 faces (2 triangles each)
            const baseIdx = vertexIndex;
            const faces = [
              [1, 3, 2], [1, 4, 3],
              [5, 6, 7], [5, 7, 8],
              [1, 2, 6], [1, 6, 5],
              [3, 4, 8], [3, 8, 7],
              [1, 5, 8], [1, 8, 4],
              [2, 3, 7], [2, 7, 6],
            ];

            faces.forEach((face) => {
              layerFaces[layerIdx].push(
                `f ${baseIdx + face[0] - 1} ${baseIdx + face[1] - 1} ${baseIdx + face[2] - 1}`
              );
            });

            vertexIndex += 8;
          });
        }
      }

      // Write to OBJ
      for (let i = 0; i < numLayers; i++) {
        if (layerVertices[i].length > 0) {
          objContent += `g Layer_${i + 1}\n`;
          objContent += `usemtl Material_${i + 1}\n`;
          objContent += layerVertices[i].join('\n') + '\n';
          objContent += layerFaces[i].join('\n') + '\n\n';
        }
      }

      // Download OBJ
      const blobObj = new Blob([objContent], { type: 'text/plain' });
      const urlObj = URL.createObjectURL(blobObj);
      const linkObj = document.createElement('a');
      linkObj.href = urlObj;
      linkObj.download = 'model.obj';
      linkObj.click();
      URL.revokeObjectURL(urlObj);

      // Download MTL
      const blobMtl = new Blob([mtlContent], { type: 'text/plain' });
      const urlMtl = URL.createObjectURL(blobMtl);
      const linkMtl = document.createElement('a');
      linkMtl.href = urlMtl;
      linkMtl.download = 'model.mtl';
      linkMtl.click();
      URL.revokeObjectURL(urlMtl);
    });
  }, [nodes, connections, setExportFn, sortedStops]);

  const count = GRID_SIZE * GRID_SIZE;

  // Extract wave params for GPU
  const waveParams = useMemo(() => extractWaveParams(nodes), [nodes]);

  // Animation Loop - GPU based
  useFrame((_, delta) => {
    if (!paused) {
      timeRef.current += delta;
    }

    const gpu = gpuGeneratorRef.current;
    if (!gpu) return;

    const time = timeRef.current;

    // Update GPU generator params and render heightmap
    gpu.updateParams(waveParams, time);
    gpu.render();

    // Skip layer rendering if in grayscale mode
    if (grayscaleMode) {
      sortedStops.forEach((_, layerIdx) => {
        const meshRef = meshRefs.current[layerIdx];
        if (meshRef) meshRef.count = 0;
      });
      return;
    }

    const cellSize = GRID_WORLD_SIZE / GRID_SIZE;
    const offset = GRID_WORLD_SIZE / 2;
    const indices = sortedStops.map(() => 0);

    // Use GPU-computed heightmap for layer rendering
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        // Read height from GPU-rendered pixels (R channel)
        const val = gpu.getHeightAt(i, j);

        const x = i * cellSize - offset;
        const z = j * cellSize - offset;

        sortedStops.forEach((stop, layerIdx) => {
          const shouldExist = layerIdx === 0 || val >= stop.position;
          if (!shouldExist) return;

          const meshRef = meshRefs.current[layerIdx];
          if (!meshRef) return;

          tempObject.position.set(x, cellSize * (layerIdx + 0.5), z);
          tempObject.scale.set(cellSize, cellSize, cellSize);
          tempObject.updateMatrix();
          meshRef.setMatrixAt(indices[layerIdx]++, tempObject.matrix);
        });
      }
    }

    // Update instance counts
    sortedStops.forEach((_, layerIdx) => {
      const meshRef = meshRefs.current[layerIdx];
      if (meshRef) {
        meshRef.count = indices[layerIdx];
        meshRef.instanceMatrix.needsUpdate = true;
      }
    });
  });

  const boxGeometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  // Shader uniforms for smooth texture plane (no pixelation)
  const shaderUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uWaveType: { value: waveParams.waveType },
    uDirection: { value: waveParams.direction },
    uProfile: { value: waveParams.profile },
    uWaveScale: { value: waveParams.waveScale },
    uDistortion: { value: waveParams.distortion },
    uDetail: { value: waveParams.detail },
    uDetailScale: { value: waveParams.detailScale },
    uDetailRoughness: { value: waveParams.detailRoughness },
    uPhaseSpeed: { value: waveParams.phaseSpeed },
    uGridSize: { value: GRID_WORLD_SIZE },
    uOffsetX: { value: waveParams.offsetX },
    uOffsetY: { value: waveParams.offsetY },
  }), []);

  // Update shader uniforms when params change
  const shaderMaterialRef = useRef<THREE.ShaderMaterial>(null);
  useEffect(() => {
    if (shaderMaterialRef.current) {
      shaderMaterialRef.current.uniforms.uWaveType.value = waveParams.waveType;
      shaderMaterialRef.current.uniforms.uDirection.value = waveParams.direction;
      shaderMaterialRef.current.uniforms.uProfile.value = waveParams.profile;
      shaderMaterialRef.current.uniforms.uWaveScale.value = waveParams.waveScale;
      shaderMaterialRef.current.uniforms.uDistortion.value = waveParams.distortion;
      shaderMaterialRef.current.uniforms.uDetail.value = waveParams.detail;
      shaderMaterialRef.current.uniforms.uDetailScale.value = waveParams.detailScale;
      shaderMaterialRef.current.uniforms.uDetailRoughness.value = waveParams.detailRoughness;
      shaderMaterialRef.current.uniforms.uPhaseSpeed.value = waveParams.phaseSpeed;
      shaderMaterialRef.current.uniforms.uOffsetX.value = waveParams.offsetX;
      shaderMaterialRef.current.uniforms.uOffsetY.value = waveParams.offsetY;
    }
  }, [waveParams]);

  // Update time for shader
  useFrame(() => {
    if (shaderMaterialRef.current) {
      shaderMaterialRef.current.uniforms.uTime.value = timeRef.current;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Layered relief meshes */}
      {sortedStops.map((_, layerIdx) => (
        <instancedMesh
          key={layerIdx}
          ref={(el) => { meshRefs.current[layerIdx] = el; }}
          args={[boxGeometry, undefined, count]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color={colorObjects[layerIdx]}
            roughness={1.0}
            metalness={0}
          />
        </instancedMesh>
      ))}

      {/* Smooth grayscale texture plane using GPU shader directly */}
      <mesh
        ref={texturePlaneRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
        visible={grayscaleMode}
      >
        <planeGeometry args={[GRID_WORLD_SIZE, GRID_WORLD_SIZE]} />
        <shaderMaterial
          ref={shaderMaterialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={shaderUniforms}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

// Color Ramp UI Component
interface ColorRampUIProps {
  stops: ColorRampStop[];
  setStops: (stops: ColorRampStop[]) => void;
}

const ColorRampUI: React.FC<ColorRampUIProps> = ({ stops, setStops }) => {
  const [selectedStopIndex, setSelectedStopIndex] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const gradientRef = useRef<HTMLDivElement>(null);

  const sortedStops = useMemo(() =>
    [...stops].sort((a, b) => a.position - b.position),
    [stops]
  );

  // Generate constant (step) gradient CSS - no blending between colors
  const gradientStyle = useMemo(() => {
    const colorStops: string[] = [];
    sortedStops.forEach((stop, i) => {
      const pos = stop.position * 100;
      const nextPos = i < sortedStops.length - 1 ? sortedStops[i + 1].position * 100 : 100;
      colorStops.push(`${stop.color} ${pos}%`);
      colorStops.push(`${stop.color} ${nextPos}%`);
    });
    return `linear-gradient(to right, ${colorStops.join(', ')})`;
  }, [sortedStops]);

  // Handle click on gradient bar to add new stop
  const handleGradientClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (stops.length >= 8) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const position = Math.max(0, Math.min(1, x / rect.width));

    // Don't add if too close to existing stop
    const minDistance = 0.05;
    const tooClose = stops.some(s => Math.abs(s.position - position) < minDistance);
    if (tooClose) return;

    // Interpolate color from adjacent stops
    let color = '#808080';
    const sorted = [...stops].sort((a, b) => a.position - b.position);
    for (let i = 0; i < sorted.length - 1; i++) {
      if (position >= sorted[i].position && position <= sorted[i + 1].position) {
        const t = (position - sorted[i].position) / (sorted[i + 1].position - sorted[i].position);
        const c1 = new THREE.Color(sorted[i].color);
        const c2 = new THREE.Color(sorted[i + 1].color);
        c1.lerp(c2, t);
        color = '#' + c1.getHexString();
        break;
      }
    }

    setStops([...stops, { position, color }]);
  }, [stops, setStops]);

  // Handle stop drag
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (draggingIndex === null || !gradientRef.current) return;

    const rect = gradientRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const position = Math.max(0, Math.min(1, x / rect.width));

    const newStops = [...stops];
    newStops[draggingIndex] = { ...newStops[draggingIndex], position };
    setStops(newStops);
  }, [draggingIndex, stops, setStops]);

  const handleMouseUp = useCallback(() => {
    setDraggingIndex(null);
  }, []);

  React.useEffect(() => {
    if (draggingIndex !== null) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingIndex, handleMouseMove, handleMouseUp]);

  // Delete stop
  const deleteStop = useCallback((index: number) => {
    if (stops.length <= 2) return;
    const newStops = stops.filter((_, i) => i !== index);
    setStops(newStops);
    setSelectedStopIndex(null);
  }, [stops, setStops]);

  // Update stop color
  const updateStopColor = useCallback((index: number, color: string) => {
    const newStops = [...stops];
    newStops[index] = { ...newStops[index], color };
    setStops(newStops);
  }, [stops, setStops]);

  // Update stop position
  const updateStopPosition = useCallback((index: number, position: number) => {
    const newStops = [...stops];
    newStops[index] = { ...newStops[index], position: Math.max(0, Math.min(1, position)) };
    setStops(newStops);
  }, [stops, setStops]);

  // Reset to default
  const resetStops = useCallback(() => {
    setStops([...DEFAULT_COLOR_RAMP_STOPS]);
    setSelectedStopIndex(null);
  }, [setStops]);

  return (
    <div className="bg-black/90 backdrop-blur text-white p-4 rounded-lg border border-gray-700 w-72 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-sm">Color Ramp</span>
        <button
          onClick={resetStops}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
          title="Reset to default"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Gradient Bar */}
      <div
        ref={gradientRef}
        className="h-6 rounded cursor-pointer relative mb-2 border border-gray-600"
        style={{ background: gradientStyle }}
        onClick={handleGradientClick}
      >
        {/* Stop markers */}
        {stops.map((stop, idx) => (
          <div
            key={idx}
            className={`absolute top-full w-3 h-3 -translate-x-1/2 cursor-grab ${
              selectedStopIndex === idx ? 'z-10' : ''
            }`}
            style={{ left: `${stop.position * 100}%` }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setDraggingIndex(idx);
              setSelectedStopIndex(idx);
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedStopIndex(idx);
            }}
          >
            <div
              className={`w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent ${
                selectedStopIndex === idx ? 'border-b-blue-400' : 'border-b-gray-400'
              }`}
            />
          </div>
        ))}
      </div>

      {/* Position labels */}
      <div className="flex justify-between text-[10px] text-gray-500 mb-3">
        <span>0.00</span>
        <span>0.50</span>
        <span>1.00</span>
      </div>

      {/* Selected stop editor */}
      {selectedStopIndex !== null && stops[selectedStopIndex] && (
        <div className="border border-gray-700 rounded p-2 mb-3 bg-gray-800/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Selected Stop</span>
            {stops.length > 2 && (
              <button
                onClick={() => deleteStop(selectedStopIndex)}
                className="p-1 hover:bg-red-600/50 rounded transition-colors text-red-400"
                title="Delete stop"
              >
                <X size={12} />
              </button>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={stops[selectedStopIndex].color}
              onChange={(e) => updateStopColor(selectedStopIndex, e.target.value)}
              className="w-8 h-8 rounded cursor-pointer bg-transparent border border-gray-600"
            />
            <div className="flex-1">
              <label className="text-[10px] text-gray-500">Position</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={stops[selectedStopIndex].position.toFixed(2)}
                onChange={(e) => updateStopPosition(selectedStopIndex, parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* Layer info */}
      <div className="space-y-1">
        <div className="text-[10px] text-gray-500 mb-1">Layers ({sortedStops.length})</div>
        {[...sortedStops].reverse().map((stop, i) => {
          const layerNum = sortedStops.length - i;
          const isBase = i === sortedStops.length - 1;
          return (
            <div key={i} className="flex items-center gap-2 text-xs">
              <div
                className="w-3 h-3 rounded-sm border border-gray-600"
                style={{ backgroundColor: stop.color }}
              />
              <span className="text-gray-400">
                {isBase ? 'Base' : `Layer ${layerNum}`}
                {!isBase && ` (val <= ${stop.position.toFixed(2)})`}
              </span>
            </div>
          );
        })}
      </div>

      {/* Help text */}
      <div className="text-[10px] text-gray-600 mt-2 pt-2 border-t border-gray-800">
        Click gradient to add stop (max 8)
      </div>
    </div>
  );
};

export const Scene: React.FC<SceneProps> = (props) => {
  const exportRef = useRef<() => void>(() => {});
  const [paused, setPaused] = useState(false);
  const [colorRampStops, setColorRampStops] = useState<ColorRampStop[]>(DEFAULT_COLOR_RAMP_STOPS);
  const [grayscaleMode, setGrayscaleMode] = useState(false);

  // Spacebar to toggle pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        setPaused(p => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="w-full h-full bg-gray-900 relative">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[15, 15, 15]} fov={45} />
        <OrbitControls
          makeDefault
          autoRotate={!paused}
          autoRotateSpeed={0.5}
        />

        <ambientLight intensity={0.15} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={0.6}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <Environment preset="studio" intensity={0.05} />

        <group position={[0, -2, 0]}>
          <ReliefGrid
            {...props}
            setExportFn={(fn) => (exportRef.current = fn)}
            paused={paused}
            colorRampStops={colorRampStops}
            grayscaleMode={grayscaleMode}
          />
        </group>

        <ContactShadows
          position={[0, -2, 0]}
          opacity={0.4}
          scale={30}
          blur={2}
          far={5}
        />
      </Canvas>

      {/* Top Controls */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={() => setGrayscaleMode(!grayscaleMode)}
          className={`text-white px-3 py-2 rounded-lg flex items-center gap-2 shadow-lg transition-colors border text-sm ${
            grayscaleMode
              ? 'bg-purple-600 hover:bg-purple-500 border-purple-400'
              : 'bg-gray-700 hover:bg-gray-600 border-gray-600'
          }`}
          title="Toggle grayscale texture preview"
        >
          <Eye size={14} />
          {grayscaleMode ? 'Color' : 'Texture'}
        </button>
        <button
          onClick={() => setPaused(!paused)}
          className={`text-white px-3 py-2 rounded-lg flex items-center gap-2 shadow-lg transition-colors border text-sm ${
            paused
              ? 'bg-yellow-600 hover:bg-yellow-500 border-yellow-400'
              : 'bg-gray-700 hover:bg-gray-600 border-gray-600'
          }`}
        >
          {paused ? (
            <Play size={14} fill="currentColor" />
          ) : (
            <Pause size={14} fill="currentColor" />
          )}
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button
          onClick={() => exportRef.current()}
          className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg flex items-center gap-2 shadow-lg transition-colors border border-blue-500 text-sm"
        >
          <Download size={14} />
          Export OBJ
        </button>
      </div>

      {/* Color Ramp UI - Bottom Right */}
      <div className="absolute bottom-4 right-4">
        <ColorRampUI stops={colorRampStops} setStops={setColorRampStops} />
      </div>
    </div>
  );
};
