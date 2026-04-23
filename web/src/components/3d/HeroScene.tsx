'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useGLTF, ContactShadows, Environment, OrbitControls } from '@react-three/drei';
import { patternVert } from './patterns/common';
import patterns from './patterns';

useGLTF.preload('/3dforweb.glb');

// ─── Choose active pattern here ───
const ACTIVE_PATTERN = 'waveTest';

function Model() {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/3dforweb.glb', 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

  const pattern = patterns[ACTIVE_PATTERN];
  const defaults = pattern.defaults || {};

  const ledMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSpeed: { value: defaults.uSpeed ?? 1.0 },
      uParam1: { value: defaults.uParam1 ?? 0.0 },
      uParam2: { value: 0.0 },   // LOD fadeStart
      uParam3: { value: 0.29 },  // LOD fadeEnd
      uParam4: { value: defaults.uParam4 ?? 0.0 },
      uAspect: { value: 2.0 },
    },
    vertexShader: patternVert,
    fragmentShader: pattern.fragmentShader,
  }), [pattern, defaults]);

  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        if (m.name === 'l') {
          m.material = ledMat;
        }
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
  }, [scene, ledMat]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y = Math.sin(t * 0.15) * 0.45;
    groupRef.current.position.y = Math.sin(t * 0.3) * 0.03;
    ledMat.uniforms.uTime.value = t;
  });

  return (
    <group ref={groupRef} scale={[0.1, 0.1, 0.1]}>
      <primitive object={scene} />
    </group>
  );
}

export default function HeroScene() {
  return (
    <div id="three-canvas" style={{ width: '100%', height: '100%' }}>
      <Canvas camera={{ position: [0.0, 5.7, 10.3], fov: 28 }} dpr={[1, 2]} shadows={{ type: THREE.PCFShadowMap }}>
        <ambientLight intensity={0.3} color="#fef6e8" />
        <directionalLight position={[2.3, 3.9, 6]} intensity={2.60} color="#ffffff" castShadow
          shadow-mapSize-width={2048} shadow-mapSize-height={2048}
          shadow-camera-near={0.1} shadow-camera-far={50}
          shadow-camera-left={-10} shadow-camera-right={10}
          shadow-camera-top={10} shadow-camera-bottom={-10}
          shadow-bias={-0.0005} />
        <directionalLight position={[-4, 3, 4]} intensity={0.4} color="#dde8ff" />
        <directionalLight position={[-2, 5, -6]} intensity={0.5} color="#fff4e0" />
        <pointLight position={[0, -2, 3]} intensity={0.15} color="#e8c89e" distance={15} decay={2} />
        <Environment preset="city" environmentIntensity={0.25} />
        <Model />
        <OrbitControls target={[0, 1.4, 0]} enablePan={false} enableZoom enableRotate />
        <ContactShadows position={[0, -2.5, 0]} opacity={0.35} scale={20} blur={2.5} far={6} color="#1a1814" />
      </Canvas>
    </div>
  );
}
