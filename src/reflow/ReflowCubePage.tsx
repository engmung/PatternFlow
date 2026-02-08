import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Box, Camera, X } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';
import SEO from '../components/SEO';
import { ReliefGrid } from '../studio/ReliefGrid';
import { getCubePresetById, cubePresetExists } from './cubePresets';

// Pattern Cube - 6 faces with the same pattern
const PatternCube: React.FC<{
  preset: any;
  cubeSize?: number;
}> = ({ preset, cubeSize = 5 }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Slow rotation
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1;
      groupRef.current.rotation.x += delta * 0.05;
    }
  });

  // Scale to fit cube size
  const scale = cubeSize / 5;
  // Increase distance from center to prevent overlap (relief bars extend outward)
  const offset = cubeSize; // Extra offset for relief bar height

  // Face configurations - original rotations
  const faces = [
    { position: [0, offset, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number] },           // Top
    { position: [0, -offset, 0] as [number, number, number], rotation: [Math.PI, 0, 0] as [number, number, number] },    // Bottom
    { position: [0, 0, offset] as [number, number, number], rotation: [Math.PI/2, 0, 0] as [number, number, number] },   // Front
    { position: [0, 0, -offset] as [number, number, number], rotation: [-Math.PI/2, 0, 0] as [number, number, number] }, // Back
    { position: [offset, 0, 0] as [number, number, number], rotation: [0, 0, -Math.PI/2] as [number, number, number] },  // Right
    { position: [-offset, 0, 0] as [number, number, number], rotation: [0, 0, Math.PI/2] as [number, number, number] },  // Left
  ];

  return (
    <group ref={groupRef}>
      {faces.map((face, index) => (
        <group key={index} position={face.position} rotation={face.rotation} scale={scale}>
          <ReliefGrid
            nodes={preset.nodes}
            connections={preset.connections}
            colorRampStops={preset.colorRamp}
            paused={false}
            grayscaleMode={false}
            variant="landing"
            resolutionOverride={preset.gridResolution}
          />
        </group>
      ))}
    </group>
  );
};

const ReflowCubePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const presetId = parseInt(id || '1', 10);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const preset = useMemo(() => getCubePresetById(presetId), [presetId]);
  const exists = cubePresetExists(presetId);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setCameraError(null);
      }
    } catch (err) {
      setCameraError('Camera access denied');
      console.error('Camera error:', err);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 404 - Preset not found
  if (!exists || !preset) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <SEO title={`Cube #${presetId}`} description="Patternflow Cube" />
        <div className="text-center p-8">
          <Box size={64} className="mx-auto mb-6 text-gray-600" />
          <p className="text-gray-400">Coming soon</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-black overflow-hidden">
      <SEO title={`Cube #${presetId}`} description="Patternflow Cube" />
      
      {/* Camera Background */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
      />
      
      {/* Minimal Logo - matching Navbar position */}
      <div className="fixed top-0 left-0 z-50 px-6 py-4 md:px-12">
        <Link to="/" className="font-serif text-xl md:text-2xl tracking-widest text-white font-medium hover:opacity-80 transition-opacity drop-shadow-lg">
          PATTERNFLOW<span className="text-white/50"> : reflow</span>
        </Link>
      </div>

      {/* Camera Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!cameraActive ? (
          <button
            onClick={startCamera}
            className="flex items-center gap-2 px-6 py-3 bg-white text-black font-medium rounded-full hover:bg-gray-200 transition-colors shadow-lg"
          >
            <Camera size={20} />
            Camera
          </button>
        ) : (
          <button
            onClick={stopCamera}
            className="flex items-center gap-2 px-4 py-3 bg-white/20 backdrop-blur-md text-white font-medium rounded-full hover:bg-white/30 transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {cameraError && (
        <div className="fixed bottom-20 right-6 z-50 px-4 py-2 bg-red-500/80 text-white rounded-lg text-sm">
          {cameraError}
        </div>
      )}
      
      {/* 3D Canvas - transparent background when camera is active */}
      <Canvas 
        shadows 
        gl={{ preserveDrawingBuffer: true, antialias: true, alpha: true }}
        style={{ background: cameraActive ? 'transparent' : 'black' }}
      >
        <PerspectiveCamera makeDefault position={[12, 12, 12]} fov={40} />
        <OrbitControls 
          makeDefault 
          enablePan={false}
          minDistance={5}
          maxDistance={100}
        />
        
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 20, 10]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize={[2048, 2048]}
        />
        <pointLight position={[-10, 10, -10]} intensity={0.5} color="#4facfe" />
        
        {!cameraActive && <Environment preset="city" background={false} />}
        
        {/* 6-Face Pattern Cube */}
        <PatternCube preset={preset} cubeSize={5} />
        
        {!cameraActive && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]} receiveShadow>
            <planeGeometry args={[50, 50]} />
            <shadowMaterial opacity={0.3} />
          </mesh>
        )}
      </Canvas>
    </div>
  );
};

export default ReflowCubePage;
