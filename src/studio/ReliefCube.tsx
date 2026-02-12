/**
 * ReliefCube - Optimized 6-face pattern cube
 * Uses a SINGLE heightmap and instances bars across all 6 faces
 * Much more performant than using 6 separate ReliefGrid components
 */
import React, { useMemo, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Node, Connection, ColorRampStop, NodeType, GRID_SIZE, GRID_WORLD_SIZE } from './types';
import { GPUHeightmapGenerator } from '../engine/GPUHeightmapGenerator';
import { generateFragmentShader } from './utils/shaderGenerator';

const tempObject = new THREE.Object3D();

interface ReliefCubeProps {
  nodes: Node[];
  connections: Connection[];
  colorRampStops: ColorRampStop[];
  paused: boolean;
  resolutionOverride?: number;
  cubeSize?: number;
  speed?: number;
  timeOffset?: number;
  sharedTimeRef?: React.RefObject<number>;
}

// Face transforms: [position offset direction, rotation to apply]
// Each face needs its bars to point outward from the cube center
const FACE_CONFIGS = [
  { axis: 'y', dir: 1, rotation: new THREE.Euler(0, 0, 0) },         // Top
  { axis: 'y', dir: -1, rotation: new THREE.Euler(Math.PI, 0, 0) },  // Bottom
  { axis: 'z', dir: 1, rotation: new THREE.Euler(Math.PI/2, 0, 0) }, // Front
  { axis: 'z', dir: -1, rotation: new THREE.Euler(-Math.PI/2, 0, 0) }, // Back
  { axis: 'x', dir: 1, rotation: new THREE.Euler(0, 0, -Math.PI/2) }, // Right
  { axis: 'x', dir: -1, rotation: new THREE.Euler(0, 0, Math.PI/2) }, // Left
];

export const ReliefCube: React.FC<ReliefCubeProps> = ({
  nodes,
  connections,
  colorRampStops,
  paused,
  resolutionOverride,
  cubeSize = 5,
  speed = 1.0,
  timeOffset = 0,
  sharedTimeRef,
}) => {
  const { gl } = useThree();
  const meshRefs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const timeRef = useRef(0);
  const gpuGeneratorRef = useRef<GPUHeightmapGenerator | null>(null);

  const outputSettings = useMemo(() => {
    const outputNode = nodes.find((n) => n.type === 'OUTPUT');
    let finalRes = outputNode?.data.resolution ?? GRID_SIZE;
    
    if (outputNode) {
      const resConn = connections.find(c => c.toNode === outputNode.id && c.toSocket === 'resolution');
      if (resConn) {
        const sourceNode = nodes.find(n => n.id === resConn.fromNode);
        if (sourceNode && sourceNode.data.value !== undefined) {
          finalRes = Math.max(2, Math.round(sourceNode.data.value));
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
  
  // Count per layer: resolution^2 cells * 6 faces
  const countPerFace = resolution * resolution;
  const totalCount = countPerFace * 6;

  const fragmentShaderCode = useMemo(() => {
    return generateFragmentShader(nodes, connections);
  }, [nodes, connections]);

  useFrame((_, delta) => {
    if (!sharedTimeRef) {
      if (!paused) timeRef.current += delta * speed;
    }
    const currentTime = sharedTimeRef ? sharedTimeRef.current : timeRef.current;

    if (!gpuGeneratorRef.current || lastResolutionRef.current !== resolution) {
      gpuGeneratorRef.current?.dispose();
      gpuGeneratorRef.current = new GPUHeightmapGenerator(gl, resolution);
      lastResolutionRef.current = resolution;
    }
    
    const gpu = gpuGeneratorRef.current;
    if (!gpu) return;

    // Update and render heightmap (ONCE for all 6 faces!)
    gpu.updateShader(nodes, connections, fragmentShaderCode);
    gpu.updateUniforms(currentTime + timeOffset);
    const pixels = gpu.render();

    const cellSize = GRID_WORLD_SIZE / resolution;
    const gridOffset = GRID_WORLD_SIZE / 2;
    const faceOffset = cubeSize; // Distance from center to face
    
    // Create rotation matrices for each face config
    const rotationMatrix = new THREE.Matrix4();
    const positionMatrix = new THREE.Matrix4();
    const scaleMatrix = new THREE.Matrix4();
    const finalMatrix = new THREE.Matrix4();

    sortedStops.forEach((stop, layerIdx) => {
      const mesh = meshRefs.current[layerIdx];
      if (!mesh) return;

      let instanceIdx = 0;
      
      // For each face
      FACE_CONFIGS.forEach((faceConfig) => {
        // Calculate face center position
        const faceCenterPos = new THREE.Vector3();
        if (faceConfig.axis === 'x') faceCenterPos.x = faceConfig.dir * faceOffset;
        if (faceConfig.axis === 'y') faceCenterPos.y = faceConfig.dir * faceOffset;
        if (faceConfig.axis === 'z') faceCenterPos.z = faceConfig.dir * faceOffset;
        
        for (let i = 0; i < resolution; i++) {
          for (let j = 0; j < resolution; j++) {
            const idx = (j * resolution + i) * 4;
            const val = pixels[idx] / 255.0;

            if (layerIdx === 0 || val >= stop.position) {
              // Local position on the face (before rotation)
              const localX = i * cellSize - gridOffset + cellSize / 2;
              const localZ = j * cellSize - gridOffset + cellSize / 2;
              const localY = layerIdx * layerHeight + layerHeight / 2;

              // Set local position
              tempObject.position.set(localX, localY, localZ);
              tempObject.rotation.copy(faceConfig.rotation);
              tempObject.scale.set(cellSize, layerHeight, cellSize);
              
              // Apply rotation then add face offset
              tempObject.updateMatrix();
              
              // Transform position by rotation
              const rotatedPos = new THREE.Vector3(localX, localY, localZ);
              rotatedPos.applyEuler(faceConfig.rotation);
              rotatedPos.add(faceCenterPos);
              
              // Build final matrix
              rotationMatrix.makeRotationFromEuler(faceConfig.rotation);
              positionMatrix.makeTranslation(rotatedPos.x, rotatedPos.y, rotatedPos.z);
              scaleMatrix.makeScale(cellSize, layerHeight, cellSize);
              
              finalMatrix.identity();
              finalMatrix.multiply(positionMatrix);
              finalMatrix.multiply(rotationMatrix);
              finalMatrix.multiply(scaleMatrix);
              
              mesh.setMatrixAt(instanceIdx++, finalMatrix);
            }
          }
        }
      });
      
      mesh.count = instanceIdx;
      mesh.instanceMatrix.needsUpdate = true;
    });
  });

  const MATERIAL_CONFIG = {
    roughness: 1.0,
    metalness: 0.0,
    envMapIntensity: 0.1,
  };

  return (
    <group>
      {sortedStops.map((_, layerIdx) => (
        <instancedMesh
          key={layerIdx}
          ref={(el) => { meshRefs.current[layerIdx] = el; }}
          args={[boxGeometry, undefined, totalCount]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color={colorObjects[layerIdx]} {...MATERIAL_CONFIG} />
        </instancedMesh>
      ))}
    </group>
  );
};
