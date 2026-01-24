import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Shared Wave Constants
const WAVE_SCALE = 100.0;
const WAVE_SPEED = 0.1;

// Vertex shader for the background plane
const bgVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment shader for the background plane
// Matches studio BANDS wave
const bgFragmentShader = `
  uniform float uTime;
  uniform float uScale;
  varying vec2 vUv;
  
  void main() {
    // Y-direction BANDS wave
    // Scale is very high (500), creating dense lines
    float coord = vUv.y * uScale + uTime * 0.3;
    
    // SINE profile
    float wave = 0.5 * (sin(coord * 6.2831855) + 1.0);
    
    // Output as grayscale with transparency
    // Make it prominent but not overwhelming
    float alpha = wave * 0.4; // Reduced opacity for bg
    gl_FragColor = vec4(vec3(0.9), alpha);
  }
`;

// Background Plane
const WavePlane: React.FC = () => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uScale: { value: WAVE_SCALE }, 
  }), []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh position={[0, 0, 0]}>
      <planeGeometry args={[2, 10]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={bgVertexShader}
        fragmentShader={bgFragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

const WaveDecoration: React.FC<{ side: 'left' | 'right' }> = ({ side }) => {
  return (
    <div 
      className="fixed top-0 h-screen pointer-events-none z-0 hidden lg:block"
      style={{
        left: side === 'left' ? 'calc((100vw - 56rem) / 12)' : 'auto',
        right: side === 'right' ? 'calc((100vw - 56rem) / 12)' : 'auto',
        width: 'calc((100vw - 56rem) / 3)',
        minWidth: '100px',
        maxWidth: '250px',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
        dpr={[1, 1]} // Optimized for performance
      >
        <WavePlane />
      </Canvas>
    </div>
  );
};

export default WaveDecoration;
