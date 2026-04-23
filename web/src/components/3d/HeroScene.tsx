'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useGLTF, ContactShadows, Environment, OrbitControls } from '@react-three/drei';
import { patternVert } from './patterns/common';
import patterns from './patterns';
import { useAppStore } from '@/store/useAppStore';

useGLTF.preload('/3dforweb.glb');

// ─── Choose active pattern here ───
const ACTIVE_PATTERN = 'waveTest';

function Model() {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/3dforweb.glb', 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
  const activeSection = useAppStore((state) => state.activeSection);

  const partsRef = useRef<{
    top: THREE.Mesh[];
    mid: THREE.Mesh[];
    bot: THREE.Mesh[];
    pcb: THREE.Mesh[];
    led: THREE.Mesh[];
    knobs: THREE.Mesh[];
    others: THREE.Mesh[];
  }>({
    top: [], mid: [], bot: [], pcb: [], led: [], knobs: [], others: []
  });

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
    // Reset arrays
    partsRef.current = { top: [], mid: [], bot: [], pcb: [], led: [], knobs: [], others: [] };

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        if (!m.userData.originalY) {
          m.userData.originalY = m.position.y;
          m.userData.originalZ = m.position.z;
        }

        if (m.name === 'l') {
          m.material = ledMat;
          partsRef.current.led.push(m);
        } else if (m.name.startsWith('t')) {
          partsRef.current.top.push(m);
        } else if (m.name === 'm') {
          partsRef.current.mid.push(m);
        } else if (m.name.startsWith('b') && !m.name.includes('_')) {
          partsRef.current.bot.push(m);
        } else if (m.name === 'p') {
          partsRef.current.pcb.push(m);
        } else if (m.name.startsWith('c')) {
          partsRef.current.knobs.push(m);
        } else {
          partsRef.current.others.push(m);
        }
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
  }, [scene, ledMat]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    ledMat.uniforms.uTime.value = t;

    // 1. Group Rotation/Position
    let targetRotationY = 0;
    let targetGroupY = 0;
    
    if (activeSection === 'hero') {
      targetRotationY = Math.sin(t * 0.15) * 0.45;
      targetGroupY = Math.sin(t * 0.3) * 0.03;
    } else {
      // Fixed exploded view angle
      targetRotationY = -0.5;
      targetGroupY = 0;
    }
    
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotationY, 0.05);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetGroupY, 0.05);

    // 2. Exploded View Offsets
    let offsetTop = 0;
    let offsetMid = 0;
    let offsetBot = 0;
    let offsetPcbZ = 0;

    if (activeSection === 'pcb') {
      offsetTop = 1.2;
      offsetMid = 0.5;
      offsetBot = -1.0;
      offsetPcbZ = -0.4;
    } else if (activeSection === 'assembly') {
      offsetTop = 1.5;
      offsetMid = 0.8;
      offsetBot = -1.2;
      offsetPcbZ = -0.5;
    } else if (activeSection === 'firmware') {
      offsetTop = 0;
      offsetMid = 0;
      offsetBot = 0;
      offsetPcbZ = 0;
    }

    const lerpSpeed = 0.06;
    partsRef.current.top.forEach(m => m.position.y = THREE.MathUtils.lerp(m.position.y, m.userData.originalY + offsetTop, lerpSpeed));
    partsRef.current.knobs.forEach(m => m.position.y = THREE.MathUtils.lerp(m.position.y, m.userData.originalY + offsetTop, lerpSpeed));
    partsRef.current.mid.forEach(m => m.position.y = THREE.MathUtils.lerp(m.position.y, m.userData.originalY + offsetMid, lerpSpeed));
    partsRef.current.bot.forEach(m => m.position.y = THREE.MathUtils.lerp(m.position.y, m.userData.originalY + offsetBot, lerpSpeed));
    partsRef.current.others.forEach(m => m.position.y = THREE.MathUtils.lerp(m.position.y, m.userData.originalY + offsetBot, lerpSpeed));
    partsRef.current.pcb.forEach(m => m.position.z = THREE.MathUtils.lerp(m.position.z, m.userData.originalZ + offsetPcbZ, lerpSpeed));
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
        <OrbitControls target={[0, 1.4, 0]} enablePan={false} enableZoom={true} enableRotate={true} />
        <ContactShadows position={[0, -2.5, 0]} opacity={0.35} scale={20} blur={2.5} far={6} color="#1a1814" />
      </Canvas>
    </div>
  );
}
