import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { PatternConfig, PatternType } from '../types';

interface ReliefViewerProps {
  config: PatternConfig;
  colors: string[];
  isPaused?: boolean;
}

const GRID_SIZE = 40;

// GLSL Simplex Noise (2D/3D)
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
  uniform float uScale;
  uniform float uRoughness;
  uniform int uPatternType; // 0 = Noise, 1 = Ring Wave
  
  varying vec2 vUv;
  
  void main() {
    vec2 uv = vUv * 2.0 - 1.0; // -1 to 1
    float value = 0.0;
    
    if (uPatternType == 0) {
      // Noise pattern
      float n1 = snoise(vec3(uv * uScale, uTime));
      float n2 = snoise(vec3(uv * uScale * 2.0 + 10.0, uTime * 1.5)) * uRoughness;
      value = (n1 + n2 * 0.5 + 1.0) / 2.0;
    } else {
      // Ring Wave pattern
      float dist = length(uv);
      float wave = sin(dist * uScale * 5.0 - uTime * 2.0);
      float rough = snoise(vec3(uv * 10.0, uTime)) * uRoughness * 0.5;
      value = (wave + 1.0) / 2.0 + rough;
    }
    
    value = clamp(value, 0.0, 1.0);
    value = pow(value, 1.2);
    
    gl_FragColor = vec4(vec3(value), 1.0);
  }
`;

// GPU Pattern Generator using WebGL
class GPUPatternGenerator {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private material: THREE.ShaderMaterial;
  private renderTarget: THREE.WebGLRenderTarget;
  private pixelBuffer: Uint8Array;
  public size: number;

  constructor(renderer: THREE.WebGLRenderer, size: number) {
    this.renderer = renderer;
    this.size = size;
    this.pixelBuffer = new Uint8Array(size * size * 4);

    this.camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
    this.camera.position.z = 1;

    this.scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(1, 1);

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uScale: { value: 3 },
        uRoughness: { value: 0.5 },
        uPatternType: { value: 0 },
      },
    });

    const mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(mesh);

    this.renderTarget = new THREE.WebGLRenderTarget(size, size, {
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
    });
  }

  updateUniforms(time: number, scale: number, roughness: number, patternType: number) {
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uScale.value = scale;
    this.material.uniforms.uRoughness.value = roughness;
    this.material.uniforms.uPatternType.value = patternType;
  }

  render(): Uint8Array {
    const currentRenderTarget = this.renderer.getRenderTarget();
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.scene, this.camera);
    this.renderer.readRenderTargetPixels(
      this.renderTarget,
      0, 0,
      this.size, this.size,
      this.pixelBuffer
    );
    this.renderer.setRenderTarget(currentRenderTarget);
    return this.pixelBuffer;
  }

  dispose() {
    this.renderTarget.dispose();
    this.material.dispose();
  }
}

interface VoxelReliefProps {
  config: PatternConfig;
  colors: string[];
  isPaused?: boolean;
}

const VoxelRelief: React.FC<VoxelReliefProps> = ({ config, colors, isPaused = false }) => {
  const { gl } = useThree();
  
  const meshLayer0Ref = useRef<THREE.InstancedMesh>(null);
  const meshLayer1Ref = useRef<THREE.InstancedMesh>(null);
  const meshLayer2Ref = useRef<THREE.InstancedMesh>(null);
  const meshLayer3Ref = useRef<THREE.InstancedMesh>(null);
  
  const gpuGeneratorRef = useRef<GPUPatternGenerator | null>(null);
  const timeRef = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Initialize GPU generator
  useEffect(() => {
    gpuGeneratorRef.current = new GPUPatternGenerator(gl, GRID_SIZE);
    return () => {
      gpuGeneratorRef.current?.dispose();
    };
  }, [gl]);

  // Initialize layer positions
  useEffect(() => {
    if (!meshLayer0Ref.current || !meshLayer1Ref.current || !meshLayer2Ref.current || !meshLayer3Ref.current) return;

    const offset = (GRID_SIZE - 1) / 2;

    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const id = i * GRID_SIZE + j;
        const x = (i - offset);
        const z = (j - offset);

        const setMatrix = (ref: React.RefObject<THREE.InstancedMesh>, y: number, scale = 0) => {
          dummy.position.set(x, y, z);
          dummy.scale.set(scale, scale, scale);
          dummy.updateMatrix();
          ref.current?.setMatrixAt(id, dummy.matrix);
        };

        setMatrix(meshLayer0Ref, 0, 1);
        setMatrix(meshLayer1Ref, 1, 0);
        setMatrix(meshLayer2Ref, 2, 0);
        setMatrix(meshLayer3Ref, 3, 0);
      }
    }
    
    meshLayer0Ref.current.instanceMatrix.needsUpdate = true;
    meshLayer1Ref.current.instanceMatrix.needsUpdate = true;
    meshLayer2Ref.current.instanceMatrix.needsUpdate = true;
    meshLayer3Ref.current.instanceMatrix.needsUpdate = true;
  }, [dummy]);

  useFrame(() => {
    if (!gpuGeneratorRef.current || !meshLayer1Ref.current || !meshLayer2Ref.current || !meshLayer3Ref.current) return;

    // Update time only if not paused
    if (!isPaused) {
      timeRef.current += config.speed * 0.02;
    }

    // Update GPU uniforms and render
    gpuGeneratorRef.current.updateUniforms(
      timeRef.current,
      config.scale,
      config.roughness,
      config.type === PatternType.NOISE ? 0 : 1
    );
    
    const pixels = gpuGeneratorRef.current.render();
    const offset = (GRID_SIZE - 1) / 2;

    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const id = i * GRID_SIZE + j;
        const pixelIndex = (j * GRID_SIZE + i) * 4;
        const brightness = pixels[pixelIndex] / 255;
        
        const x = (i - offset);
        const z = (j - offset);

        const showL1 = brightness > 0.25;
        const showL2 = brightness > 0.50;
        const showL3 = brightness > 0.75;

        dummy.position.set(x, 1, z);
        dummy.scale.set(showL1 ? 1 : 0, showL1 ? 1 : 0, showL1 ? 1 : 0);
        dummy.updateMatrix();
        meshLayer1Ref.current.setMatrixAt(id, dummy.matrix);

        dummy.position.set(x, 2, z);
        dummy.scale.set(showL2 ? 1 : 0, showL2 ? 1 : 0, showL2 ? 1 : 0);
        dummy.updateMatrix();
        meshLayer2Ref.current.setMatrixAt(id, dummy.matrix);

        dummy.position.set(x, 3, z);
        dummy.scale.set(showL3 ? 1 : 0, showL3 ? 1 : 0, showL3 ? 1 : 0);
        dummy.updateMatrix();
        meshLayer3Ref.current.setMatrixAt(id, dummy.matrix);
      }
    }

    meshLayer1Ref.current.instanceMatrix.needsUpdate = true;
    meshLayer2Ref.current.instanceMatrix.needsUpdate = true;
    meshLayer3Ref.current.instanceMatrix.needsUpdate = true;
  });

  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  return (
    <group scale={0.25}>
      <group position={[0, -1.5, 0]}>
        <instancedMesh ref={meshLayer0Ref} args={[geometry, undefined, GRID_SIZE * GRID_SIZE]} castShadow receiveShadow>
          <meshStandardMaterial color={colors[0]} roughness={1.0} metalness={0} />
        </instancedMesh>

        <instancedMesh ref={meshLayer1Ref} args={[geometry, undefined, GRID_SIZE * GRID_SIZE]} castShadow receiveShadow>
          <meshStandardMaterial color={colors[1]} roughness={1.0} metalness={0} />
        </instancedMesh>

        <instancedMesh ref={meshLayer2Ref} args={[geometry, undefined, GRID_SIZE * GRID_SIZE]} castShadow receiveShadow>
          <meshStandardMaterial color={colors[2]} roughness={1.0} metalness={0} />
        </instancedMesh>

        <instancedMesh ref={meshLayer3Ref} args={[geometry, undefined, GRID_SIZE * GRID_SIZE]} castShadow receiveShadow>
          <meshStandardMaterial color={colors[3]} roughness={1.0} metalness={0} />
        </instancedMesh>
      </group>
    </group>
  );
};

const ReliefViewer: React.FC<ReliefViewerProps> = ({ config, colors, isPaused = false }) => {
  return (
    <div className="w-full h-full bg-zinc-900 rounded-lg overflow-hidden relative shadow-inner">
      <Canvas
        shadows
        camera={{ position: [14, 14, 14], fov: 35 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        className="w-full h-full"
      >
        <color attach="background" args={['#050505']} />
        
        <ambientLight intensity={0.02} /> 
        
        <directionalLight 
          position={[12, 5, 8]} 
          intensity={0.4} 
          castShadow 
          shadow-mapSize={[2048, 2048]} 
          shadow-bias={-0.0001}
        >
          <orthographicCamera attach="shadow-camera" args={[-15, 15, 15, -15]} />
        </directionalLight>

        <pointLight position={[-10, 5, -5]} intensity={0.05} color="#eef" />

        <VoxelRelief config={config} colors={colors} isPaused={isPaused} />
        
        <ContactShadows 
          position={[0, -4, 0]} 
          opacity={0.4} 
          scale={30} 
          blur={2.5} 
          far={5} 
          color="#000000"
        />
        
        <OrbitControls 
          enablePan={false} 
          enableZoom={false}
          minPolarAngle={0} 
          maxPolarAngle={Math.PI / 2.2}
          minDistance={10}
          maxDistance={50}
          dampingFactor={0.05}
          autoRotate={false}
        />
        
        <Environment preset="studio" /> 
      </Canvas>
    </div>
  );
};

export default React.memo(ReliefViewer);