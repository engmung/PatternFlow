import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ContactShadows, Environment } from '@react-three/drei';
import { Node, Connection, ColorRampStop, NodeType, GRID_SIZE, GRID_WORLD_SIZE } from './types';
import { GPUHeightmapGenerator } from '../engine/GPUHeightmapGenerator';
import { generateFragmentShader } from './utils/shaderGenerator';

const tempObject = new THREE.Object3D();
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

interface ReliefGridProps {
  nodes: Node[];
  connections: Connection[];
  colorRampStops: ColorRampStop[];
  paused: boolean;
  grayscaleMode: boolean;
  setExportFn?: (fn: () => void) => void;
  // Optional override for resolution to optimize grid view
  resolutionOverride?: number;
  // Visual variant: 'default' (Studio) or 'landing' (Premium)
  variant?: 'default' | 'landing';
  // Aspect ratio for 2D view
  aspect?: number;
  // Global Time Speed
  speed?: number;
}

export const ReliefGrid: React.FC<ReliefGridProps> = ({
  nodes,
  connections,
  colorRampStops,
  paused,
  grayscaleMode,
  setExportFn,
  resolutionOverride,
  variant = 'default',
  aspect = 1,
  speed = 1.0,
}) => {
  const { gl } = useThree();
  const meshRefs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const timeRef = useRef(0);
  const gpuGeneratorRef = useRef<GPUHeightmapGenerator | null>(null);
  const texturePlaneRef = useRef<THREE.Mesh>(null);

  const outputSettings = useMemo(() => {
    const outputNode = nodes.find((n) => n.type === NodeType.OUTPUT);
    let finalRes = outputNode?.data.resolution ?? GRID_SIZE;
    
    // Attempt to resolve dynamic resolution from input connection
    if (outputNode) {
        const resConn = connections.find(c => c.toNode === outputNode.id && c.toSocket === 'resolution');
        if (resConn) {
            const sourceNode = nodes.find(n => n.id === resConn.fromNode);
            // Only support direct values for CPU-side resolution (Value, Parameter, Time?)
            if (sourceNode && sourceNode.data.value !== undefined) {
                finalRes = Math.max(2, Math.round(sourceNode.data.value)); // Ensure min 2, integer
            }
        }
    }

    return {
      resolution: resolutionOverride ?? finalRes,
      layerHeight: outputNode?.data.layerHeight ?? 0.1,
    };
  }, [nodes, connections, resolutionOverride]);

  const resolution = outputSettings.resolution;
  const layerHeight = outputSettings.layerHeight;
  const lastResolutionRef = useRef(resolution);

  // Material refs
  const shaderMaterialRef = useRef<THREE.ShaderMaterial>(null);

  React.useEffect(() => {
    return () => {
      gpuGeneratorRef.current?.dispose();
    };
  }, []);

  const sortedStops = useMemo(
    () => [...colorRampStops].sort((a, b) => a.position - b.position),
    [colorRampStops]
  );

  const colorObjects = useMemo(
    () => sortedStops.map((s) => new THREE.Color(s.color)),
    [sortedStops]
  );

  const boxGeometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const count = resolution * resolution;

  const fragmentShaderCode = useMemo(() => {
    return generateFragmentShader(nodes, connections);
  }, [nodes, connections]);

  // Trigger re-compilation when shader code changes
  useLayoutEffect(() => {
    if (shaderMaterialRef.current) {
        shaderMaterialRef.current.needsUpdate = true;
    }
  }, [fragmentShaderCode]);

  const previewUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uGridSize: { value: GRID_WORLD_SIZE },
    uAspect: { value: aspect }
  }), []);

  // Export Logic
  useLayoutEffect(() => {
    if (!setExportFn) return;
    
    setExportFn(() => {
      const gpu = gpuGeneratorRef.current;
      if (!gpu) {
        alert("Render not ready");
        return;
      }

      const pixels = gpu.render();
      const size = resolution;
      const numLayers = sortedStops.length;
      
      let objContent = "# PatternFlow Relief Export\nmtllib model.mtl\n\n";
      let mtlContent = "# PatternFlow Materials\n\n";
      
      sortedStops.forEach((stop, i) => {
        const c = new THREE.Color(stop.color);
        mtlContent += `newmtl Material_${i + 1}\nKd ${c.r.toFixed(4)} ${c.g.toFixed(4)} ${c.b.toFixed(4)}\nd 1.0\nillum 2\n\n`;
      });
      
      const cellSize = GRID_WORLD_SIZE / resolution;
      const offset = GRID_WORLD_SIZE / 2;
      let vertexIndex = 1;
      const layerVertices: string[][] = sortedStops.map(() => []);
      const layerFaces: string[][] = sortedStops.map(() => []);
      
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const idx = (j * size + i) * 4;
            const val = pixels[idx] / 255.0;
            const x = i * cellSize - offset + cellSize / 2;
            const z = j * cellSize - offset + cellSize / 2;
            
            sortedStops.forEach((stop, layerIdx) => {
                if (layerIdx > 0 && val < stop.position) return;

                const y = layerIdx * layerHeight;
                const halfSize = cellSize / 2;
                
                const verts = [
                  [x - halfSize, y, z - halfSize], [x + halfSize, y, z - halfSize],
                  [x + halfSize, y, z + halfSize], [x - halfSize, y, z + halfSize],
                  [x - halfSize, y + layerHeight, z - halfSize], [x + halfSize, y + layerHeight, z - halfSize],
                  [x + halfSize, y + layerHeight, z + halfSize], [x - halfSize, y + layerHeight, z + halfSize],
                ];
                
                verts.forEach(v => layerVertices[layerIdx].push(`v ${v[0]} ${v[1]} ${v[2]}`));
                const base = vertexIndex;
                const faces = [
                    [1,3,2], [1,4,3], [5,6,7], [5,7,8], [1,2,6], [1,6,5],
                    [3,4,8], [3,8,7], [1,5,8], [1,8,4], [2,3,7], [2,7,6]
                ];
                faces.forEach(f => layerFaces[layerIdx].push(`f ${base+f[0]-1} ${base+f[1]-1} ${base+f[2]-1}`));
                vertexIndex += 8;
            });
        }
      }
      
      for (let i = 0; i < numLayers; i++) {
        if (layerVertices[i].length > 0) {
          objContent += `g Layer_${i + 1}\nusemtl Material_${i + 1}\n${layerVertices[i].join("\n")}\n${layerFaces[i].join("\n")}\n\n`;
        }
      }

      const link = document.createElement("a");
      link.download = "model.obj";
      link.href = URL.createObjectURL(new Blob([objContent], {type: 'text/plain'}));
      link.click();
      
      const link2 = document.createElement("a");
      link2.download = "model.mtl";
      link2.href = URL.createObjectURL(new Blob([mtlContent], {type: 'text/plain'}));
      link2.click();
    });
  }, [sortedStops, resolution, layerHeight, nodes, connections, setExportFn]);

  useFrame((_, delta) => {
    if (!paused) timeRef.current += delta * speed;

    if (!gpuGeneratorRef.current || lastResolutionRef.current !== resolution) {
        gpuGeneratorRef.current?.dispose();
        gpuGeneratorRef.current = new GPUHeightmapGenerator(gl, resolution);
        lastResolutionRef.current = resolution;
    }
    
    const gpu = gpuGeneratorRef.current;
    if (!gpu) return;

    // Update shader only if it changed (using memoized code for performance)
    gpu.updateShader(nodes, connections, fragmentShaderCode);
    
    gpu.updateUniforms(timeRef.current);
    // render() internally does readPixels which is CPU intensive
    // For 25x25 grid, we MUST be careful.
    // However, if we are just one ReliefGrid, it's fine.
    const pixels = gpu.render();
    
    // Update preview material if in grayscale mode
    if (grayscaleMode && shaderMaterialRef.current) {
        shaderMaterialRef.current.uniforms.uTime.value = timeRef.current;
        shaderMaterialRef.current.uniforms.uGridSize.value = GRID_WORLD_SIZE;
        shaderMaterialRef.current.uniforms.uAspect.value = aspect;
        meshRefs.current.forEach(m => { if(m) m.count = 0; });
        return;
    }

    const cellSize = GRID_WORLD_SIZE / resolution;
    const offset = GRID_WORLD_SIZE / 2;
    
    sortedStops.forEach((stop, layerIdx) => {
      // ... (existing 3D logic) ...
      const mesh = meshRefs.current[layerIdx];
      if (!mesh) return;

      let instanceIdx = 0;
      for (let i = 0; i < resolution; i++) {
        for (let j = 0; j < resolution; j++) {
            const idx = (j * resolution + i) * 4;
            const val = pixels[idx] / 255.0;

            if (layerIdx === 0 || val >= stop.position) {
                const x = i * cellSize - offset + cellSize / 2;
                const z = j * cellSize - offset + cellSize / 2;
                const y = layerIdx * layerHeight + layerHeight/2;

                tempObject.position.set(x, y, z);
                tempObject.scale.set(cellSize, layerHeight, cellSize);
                tempObject.updateMatrix();
                mesh.setMatrixAt(instanceIdx++, tempObject.matrix);
            }
        }
      }
      mesh.count = instanceIdx;
      mesh.instanceMatrix.needsUpdate = true;
    });
  });

  // --- Visual Style Logic ---
  const isLanding = variant === 'landing';
  const MATERIAL_CONFIG = isLanding ? {
    roughness: 1.0,
    metalness: 0.0,
    envMapIntensity: 0.1, // Significantly reduced for darker look
  } : {};

  return (
    <group>
       {/* Lighting: Use High Quality for Landing, Simple for Studio */}
       {isLanding ? (
         <>
            {/* Fog for deep black depth */}
            <fog attach="fog" args={['#000000', 20, 40]} />
            
            <ambientLight intensity={0.02} />
            <directionalLight
              position={[12, 5, 8]}
              intensity={0.2} // Reduced from 0.4
              castShadow
              shadow-mapSize={[2048, 2048]}
              shadow-bias={-0.0001}
            >
              <orthographicCamera attach="shadow-camera" args={[-15, 15, 15, -15]} />
            </directionalLight>
            <pointLight position={[-10, 5, -5]} intensity={0.05} color="#eef" />
            
            {/* Darker Studio Environment */}
            <Environment preset="city" background={false} /> {/* Changed to city for potentially better contrast, or stick to studio but darker via material */}
         </>
       ) : (
          null
       )}

      {!grayscaleMode && sortedStops.map((_, layerIdx) => (
        <instancedMesh
          key={layerIdx}
          ref={(el) => { meshRefs.current[layerIdx] = el; }}
          args={[boxGeometry, undefined, count]}
          castShadow
          receiveShadow
        >
          {isLanding ? (
             <meshStandardMaterial color={colorObjects[layerIdx]} {...MATERIAL_CONFIG} />
          ) : (
             <meshLambertMaterial color={colorObjects[layerIdx]} />
          )}
        </instancedMesh>
      ))}

      {grayscaleMode && (
          <mesh 
            key={aspect}
            rotation={[-Math.PI / 2, 0, 0]} 
            position={[0, 0.01, 0]} 
            ref={texturePlaneRef}
          >
            <planeGeometry args={[GRID_WORLD_SIZE * aspect, GRID_WORLD_SIZE]} />
            <shaderMaterial
              ref={shaderMaterialRef}
              vertexShader={vertexShader}
              fragmentShader={fragmentShaderCode}
              uniforms={previewUniforms}
              side={THREE.DoubleSide}
              transparent
            />
          </mesh>
      )}
    </group>
  );
};
