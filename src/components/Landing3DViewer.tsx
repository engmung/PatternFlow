import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ContactShadows, Environment } from '@react-three/drei';
import { Node, Connection, ColorRampStop, NodeType, GRID_SIZE, GRID_WORLD_SIZE } from '../types/graph';
import { GPUHeightmapGenerator } from '../engine/GPUHeightmapGenerator';
import { generateFragmentShader } from '../engine/shaderGenerator';

export interface Landing3DViewerProps {
  nodes: Node[];
  connections: Connection[];
  colorRampStops: ColorRampStop[];
  paused: boolean;
  resolutionOverride?: number; 
}

/**
 * A dedicated 3D viewer for the Landing Page.
 * Uses the New Engine (GPUHeightmap) for logic, but implements the "Premium" Visual Style directly.
 * Isolated from the Studio's ReliefGrid to prevent regressions.
 */
export const Landing3DViewer: React.FC<Landing3DViewerProps> = ({
  nodes,
  connections,
  colorRampStops,
  paused,
  resolutionOverride = 40
}) => {
  const { gl } = useThree();
  const timeRef = useRef(0);
  const gpuGeneratorRef = useRef<GPUHeightmapGenerator | null>(null);
  const lastResolutionRef = useRef(resolutionOverride);
  
  // Instanced Mesh ref
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // CPU Color cache to avoid re-creating colors every frame
  const colorArrayRef = useRef<Float32Array | null>(null);

  // 1. Initialize GPU Engine
  useEffect(() => {
    return () => {
      gpuGeneratorRef.current?.dispose();
    };
  }, []);

  const sortedStops = useMemo(
    () => [...colorRampStops].sort((a, b) => a.position - b.position),
    [colorRampStops]
  );
  
  // Pre-allocate color utility
  const getColorRGB = (val: number, target: THREE.Color) => {
      let stopA = sortedStops[0];
      let stopB = sortedStops[sortedStops.length - 1];
      
      for (let i = 0; i < sortedStops.length - 1; i++) {
          if (val >= sortedStops[i].position && val <= sortedStops[i+1].position) {
              stopA = sortedStops[i];
              stopB = sortedStops[i+1];
              break;
          }
      }
      
      const range = stopB.position - stopA.position;
      const t = range === 0 ? 0 : (val - stopA.position) / range;
      
      // We can optimize this by caching THREE.Colors for stops, but this is fast enough for per-frame
      const cA = new THREE.Color(stopA.color);
      const cB = new THREE.Color(stopB.color);
      target.copy(cA).lerp(cB, t);
  };

  const fragmentShaderCode = useMemo(() => {
    return generateFragmentShader(nodes, connections);
  }, [nodes, connections]);

  useEffect(() => {
     // Re-init color array if resolution changes
     const count = resolutionOverride * resolutionOverride;
     colorArrayRef.current = new Float32Array(count * 3);
  }, [resolutionOverride]);

  // 2. Frame Loop: Update Engine -> Update Instances Directy
  useFrame((_, delta) => {
    if (!paused) timeRef.current += delta;

    if (!gpuGeneratorRef.current || lastResolutionRef.current !== resolutionOverride) {
        gpuGeneratorRef.current?.dispose();
        gpuGeneratorRef.current = new GPUHeightmapGenerator(gl, resolutionOverride);
        lastResolutionRef.current = resolutionOverride;
    }
    
    const gpu = gpuGeneratorRef.current;
    if (!gpu || !meshRef.current) return;

    gpu.updateShader(nodes, connections, fragmentShaderCode);
    gpu.updateUniforms(timeRef.current);
    const pixels = gpu.render(); // CPU readback overhead is here, but required for Instancing
    
    const count = resolutionOverride * resolutionOverride;
    const boxSize = GRID_WORLD_SIZE / resolutionOverride;
    const gridOffset = -GRID_WORLD_SIZE / 2 + boxSize / 2;
    const tempColor = new THREE.Color();

    for (let i = 0; i < count; i++) {
         const val = pixels[i * 4] / 255.0; // 0..1
         
         // Layout Calculation
         const row = Math.floor(i / resolutionOverride);
         const col = i % resolutionOverride;
         const x = col * boxSize + gridOffset;
         const z = row * boxSize + gridOffset;
         
         // Visual Height
         const scaleY = Math.max(0.01, val * 5.0); // Taller scale to match original impact
         
         dummy.position.set(x, scaleY / 2, z);
         dummy.scale.set(1.0, scaleY, 1.0); // Exact 1.0 to close gaps
         dummy.updateMatrix();
         meshRef.current.setMatrixAt(i, dummy.matrix);
         
         // Color
         getColorRGB(val, tempColor);
         meshRef.current.setColorAt(i, tempColor);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  // --- Visual Style: Premium ---
  const MATERIAL_CONFIG = {
    roughness: 1.0,
    metalness: 0.0,
  };
  
  const totalCount = resolutionOverride * resolutionOverride;

  return (
    <group>
       <ambientLight intensity={0.05} />
       <directionalLight
        position={[12, 5, 8]}
        intensity={0.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
      >
        <orthographicCamera attach="shadow-camera" args={[-15, 15, 15, -15]} />
      </directionalLight>
      <pointLight position={[-10, 5, -5]} intensity={0.1} color="#eef" />

       <Environment preset="studio" />
       <ContactShadows
            position={[0, -0.1, 0]}
            opacity={0.4}
            scale={30}
            blur={2.5}
            far={5}
            color="#000000"
       />

       <instancedMesh
          ref={meshRef}
          args={[undefined, undefined, totalCount]}
          castShadow
          receiveShadow
       >
          <boxGeometry args={[GRID_WORLD_SIZE / resolutionOverride, 1, GRID_WORLD_SIZE / resolutionOverride]} />
          <meshStandardMaterial {...MATERIAL_CONFIG} />
       </instancedMesh>
    </group>
  );
};
