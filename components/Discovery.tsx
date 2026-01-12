import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { noise } from '../utils/noise';

const GRID_SIZE = 30;

const MiniRelief: React.FC<{ offset: number, scale: number, colors: string[] }> = ({ offset, scale, colors }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime * 0.2 + offset;
    const half = (GRID_SIZE - 1) / 2;

    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const id = i * GRID_SIZE + j;
        const nx = (i / GRID_SIZE) * 2 - 1;
        const ny = (j / GRID_SIZE) * 2 - 1;
        
        // Simulating the wave texture logic
        const dist = Math.sqrt(nx * nx + ny * ny);
        let value = (Math.sin(dist * scale - t) + 1) / 2;
        value += noise.noise3D(nx * scale * 0.2, ny * scale * 0.2, t) * 0.2;
        
        const h = Math.max(0, Math.floor(value * 4)); 
        
        dummy.position.set(i - half, h, j - half);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(id, dummy.matrix);
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const geometry = useMemo(() => new THREE.BoxGeometry(0.9, 1, 0.9), []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: colors[3], 
    roughness: 0.8,
    metalness: 0.1 
  }), [colors]);

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, GRID_SIZE * GRID_SIZE]} castShadow receiveShadow />
  );
};

// Use memo for dummy and geometry
function useMemo<T>(factory: () => T, deps: any[]): T {
    return React.useMemo(factory, deps);
}

const Discovery: React.FC = () => {
  const [delta, setDelta] = useState(0);
  const colors = ['#000', '#333', '#666', '#fff'];

  return (
    <section className="w-full bg-black py-32 px-6 border-t border-zinc-900">
      <div className="max-w-7xl mx-auto space-y-20">
        
        <div className="text-center space-y-4">
          <h2 className="font-serif text-3xl md:text-5xl text-white">Experience the Butterfly Effect</h2>
          <p className="text-zinc-500 max-w-2xl mx-auto font-light leading-relaxed">
            The same minimal input creates absolute calm in simple systems, 
            but dramatic chaos in complex orders. 
            Adjust the control below to see how complexity amplifies change.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[500px]">
          {/* Simple Pattern */}
          <div className="relative bg-zinc-900/30 rounded-lg border border-zinc-800/50 overflow-hidden group">
            <div className="absolute top-6 left-6 z-10">
              <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">System A</span>
              <h3 className="text-white font-serif text-xl tracking-wide">Minimal Complexity</h3>
            </div>
            <Canvas shadows camera={{ position: [25, 25, 25], fov: 35 }}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />
              <group scale={0.5} position={[0, -2, 0]}>
                <MiniRelief offset={delta} scale={3} colors={colors} />
              </group>
              <Environment preset="studio" />
            </Canvas>
          </div>

          {/* Complex Pattern */}
          <div className="relative bg-zinc-900/30 rounded-lg border border-zinc-800/50 overflow-hidden group">
            <div className="absolute top-6 left-6 z-10">
              <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">System B</span>
              <h3 className="text-white font-serif text-xl tracking-wide">High Complexity</h3>
            </div>
            <Canvas shadows camera={{ position: [15, 15, 15], fov: 60 }}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />
              <group scale={0.4} position={[0, -2, 0]}>
                <MiniRelief offset={delta} scale={15} colors={colors} />
              </group>
              <Environment preset="studio" />
            </Canvas>
          </div>
        </div>

        {/* Control Knob / Slider */}
        <div className="max-w-md mx-auto space-y-4 pt-10">
           <div className="flex justify-between items-end mb-2">
             <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-tighter">Input Delta: {delta.toFixed(2)}</span>
             <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-tighter">Small change, big impact</span>
           </div>
           <input 
            type="range" 
            min="-2" 
            max="2" 
            step="0.01" 
            value={delta}
            onChange={(e) => setDelta(parseFloat(e.target.value))}
            className="w-full h-1 bg-zinc-800 appearance-none rounded-full cursor-pointer accent-white hover:bg-zinc-700 transition-colors"
           />
           <div className="flex justify-center mt-10">
              <p className="text-zinc-700 text-[10px] font-mono uppercase tracking-[0.2em] animate-pulse">
                &larr; Slide to manipulate the texture &rarr;
              </p>
           </div>
        </div>

      </div>
    </section>
  );
};

export default Discovery;
