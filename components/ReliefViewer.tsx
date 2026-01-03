import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { PatternConfig } from '../types';

interface ReliefViewerProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  config: PatternConfig;
  colors: string[];
}

const GRID_SIZE = 40;

const VoxelRelief: React.FC<{ canvasRef: React.RefObject<HTMLCanvasElement>, colors: string[] }> = ({ canvasRef, colors }) => {
  // We now have 4 layers: Base (0) + 3 Dynamic Layers
  const meshLayer0Ref = useRef<THREE.InstancedMesh>(null);
  const meshLayer1Ref = useRef<THREE.InstancedMesh>(null);
  const meshLayer2Ref = useRef<THREE.InstancedMesh>(null);
  const meshLayer3Ref = useRef<THREE.InstancedMesh>(null);

  // Offscreen canvas for downsampling
  const tempCanvas = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = GRID_SIZE;
    c.height = GRID_SIZE;
    return c;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Initialize positions
  useEffect(() => {
    if (!meshLayer0Ref.current || !meshLayer1Ref.current || !meshLayer2Ref.current || !meshLayer3Ref.current) return;

    const offset = (GRID_SIZE - 1) / 2;

    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const id = i * GRID_SIZE + j;
        const x = (i - offset);
        const z = (j - offset);

        // Common setup for matrix update
        const setMatrix = (ref: React.RefObject<THREE.InstancedMesh>, y: number, scale = 0) => {
             dummy.position.set(x, y, z);
             dummy.scale.set(scale, scale, scale);
             dummy.updateMatrix();
             ref.current?.setMatrixAt(id, dummy.matrix);
        };

        // Layer 0: Base - Always visible at y=0
        setMatrix(meshLayer0Ref, 0, 1);
        
        // Layer 1: y=1 (Hidden initially)
        setMatrix(meshLayer1Ref, 1, 0);

        // Layer 2: y=2 (Hidden initially)
        setMatrix(meshLayer2Ref, 2, 0);

        // Layer 3: y=3 (Hidden initially)
        setMatrix(meshLayer3Ref, 3, 0);
      }
    }
    
    meshLayer0Ref.current.instanceMatrix.needsUpdate = true;
    meshLayer1Ref.current.instanceMatrix.needsUpdate = true;
    meshLayer2Ref.current.instanceMatrix.needsUpdate = true;
    meshLayer3Ref.current.instanceMatrix.needsUpdate = true;
  }, [dummy]);

  useFrame(() => {
    if (!canvasRef.current || !tempCanvas || !meshLayer1Ref.current || !meshLayer2Ref.current || !meshLayer3Ref.current) return;

    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;

    // Downsample the source canvas to 40x40
    ctx.clearRect(0, 0, GRID_SIZE, GRID_SIZE);
    ctx.drawImage(canvasRef.current, 0, 0, GRID_SIZE, GRID_SIZE);
    
    const imageData = ctx.getImageData(0, 0, GRID_SIZE, GRID_SIZE);
    const pixels = imageData.data;

    const offset = (GRID_SIZE - 1) / 2;

    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const id = i * GRID_SIZE + j;
        
        // Map 2D grid to array index
        const pixelIndex = (j * GRID_SIZE + i) * 4;
        const brightness = pixels[pixelIndex] / 255;
        
        const x = (i - offset);
        const z = (j - offset);

        // Thresholds logic for 4 layers
        // Layer 0 is base (always there)
        // Layer 1 appears > 0.25
        // Layer 2 appears > 0.50
        // Layer 3 appears > 0.75
        
        const showL1 = brightness > 0.25;
        const showL2 = brightness > 0.50;
        const showL3 = brightness > 0.75;

        // Update Layer 1
        dummy.position.set(x, 1, z);
        dummy.scale.set(showL1 ? 1 : 0, showL1 ? 1 : 0, showL1 ? 1 : 0);
        dummy.updateMatrix();
        meshLayer1Ref.current.setMatrixAt(id, dummy.matrix);

        // Update Layer 2
        dummy.position.set(x, 2, z);
        dummy.scale.set(showL2 ? 1 : 0, showL2 ? 1 : 0, showL2 ? 1 : 0);
        dummy.updateMatrix();
        meshLayer2Ref.current.setMatrixAt(id, dummy.matrix);

        // Update Layer 3
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

  // Cube geometry 1x1x1 for no gaps
  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  return (
    <group scale={0.25}>
      {/* Center the group vertically approximately. 4 layers means height goes 0 to 3. Center is 1.5. */}
      <group position={[0, -1.5, 0]}>
        
        {/* Layer 0: Base */}
        <instancedMesh ref={meshLayer0Ref} args={[geometry, undefined, GRID_SIZE * GRID_SIZE]} castShadow receiveShadow>
          <meshStandardMaterial color={colors[0]} roughness={1.0} metalness={0} />
        </instancedMesh>

        {/* Layer 1 */}
        <instancedMesh ref={meshLayer1Ref} args={[geometry, undefined, GRID_SIZE * GRID_SIZE]} castShadow receiveShadow>
          <meshStandardMaterial color={colors[1]} roughness={1.0} metalness={0} />
        </instancedMesh>

        {/* Layer 2 */}
        <instancedMesh ref={meshLayer2Ref} args={[geometry, undefined, GRID_SIZE * GRID_SIZE]} castShadow receiveShadow>
          <meshStandardMaterial color={colors[2]} roughness={1.0} metalness={0} />
        </instancedMesh>

        {/* Layer 3: Top */}
        <instancedMesh ref={meshLayer3Ref} args={[geometry, undefined, GRID_SIZE * GRID_SIZE]} castShadow receiveShadow>
          <meshStandardMaterial color={colors[3]} roughness={1.0} metalness={0} />
        </instancedMesh>

      </group>
    </group>
  );
};

const ReliefViewer: React.FC<ReliefViewerProps> = ({ canvasRef, colors }) => {
  return (
    <div className="w-full h-full bg-zinc-900 rounded-lg overflow-hidden relative shadow-inner">
      <Canvas
        shadows
        camera={{ position: [14, 14, 14], fov: 35 }} // Zoomed in closer
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        className="w-full h-full"
      >
        <color attach="background" args={['#050505']} />
        
        {/* Reduced Ambient Light significantly for deeper mood */}
        <ambientLight intensity={0.02} /> 
        
        {/* Main Key Light: Reduced intensity to fix overexposure */}
        <directionalLight 
          position={[12, 5, 8]} 
          intensity={0.4} 
          castShadow 
          shadow-mapSize={[2048, 2048]} 
          shadow-bias={-0.0001}
        >
          <orthographicCamera attach="shadow-camera" args={[-15, 15, 15, -15]} />
        </directionalLight>

        {/* Very Subtle Fill Light */}
        <pointLight position={[-10, 5, -5]} intensity={0.05} color="#eef" />

        <VoxelRelief canvasRef={canvasRef} colors={colors} />
        
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
          minPolarAngle={0} 
          maxPolarAngle={Math.PI / 2.2}
          minDistance={10}
          maxDistance={50}
          dampingFactor={0.05}
          autoRotate={false}
        />
        
        {/* Minimized environment light */}
        <Environment preset="studio" intensity={0.02} /> 
      </Canvas>
    </div>
  );
};

export default React.memo(ReliefViewer);