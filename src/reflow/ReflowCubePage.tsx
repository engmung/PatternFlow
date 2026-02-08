import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Box, Camera, X } from 'lucide-react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';
import SEO from '../components/SEO';
import { ReliefCube } from '../studio/ReliefCube';
import { getCubePresetById, cubePresetExists } from './cubePresets';


// Draggable Pattern Cube wrapper - handles world-space rotation
const DraggableCube: React.FC<{
  preset: any;
  cubeSize?: number;
}> = ({ preset, cubeSize = 5 }) => {
  const groupRef = useRef<THREE.Group>(null);
  const { gl } = useThree();
  
  // Drag state
  const isDragging = useRef(false);
  const previousMouse = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const targetQuaternion = useRef(new THREE.Quaternion());
  
  // World-space rotation axes
  const worldAxisX = new THREE.Vector3(1, 0, 0);
  const worldAxisY = new THREE.Vector3(0, 1, 0);
  const rotationSpeed = 0.008;
  
  // Handle mouse/touch events for dragging
  useEffect(() => {
    const canvas = gl.domElement;
    
    const onPointerDown = (e: PointerEvent) => {
      isDragging.current = true;
      previousMouse.current = { x: e.clientX, y: e.clientY };
      velocity.current = { x: 0, y: 0 };
    };
    
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      
      const deltaX = e.clientX - previousMouse.current.x;
      const deltaY = e.clientY - previousMouse.current.y;
      
      // Store velocity for momentum
      velocity.current = { x: deltaX * rotationSpeed, y: deltaY * rotationSpeed };
      
      // Apply world-space rotation to target quaternion
      const quatY = new THREE.Quaternion().setFromAxisAngle(worldAxisY, deltaX * rotationSpeed);
      const quatX = new THREE.Quaternion().setFromAxisAngle(worldAxisX, deltaY * rotationSpeed);
      
      targetQuaternion.current.premultiply(quatY);
      targetQuaternion.current.premultiply(quatX);
      
      previousMouse.current = { x: e.clientX, y: e.clientY };
    };
    
    const onPointerUp = () => {
      isDragging.current = false;
    };
    
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerUp);
    
    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerUp);
    };
  }, [gl]);

  // Momentum + auto rotation (world-space) with smooth interpolation
  useFrame((_, delta) => {
    if (groupRef.current) {
      // Auto rotation when not dragging and no velocity
      if (!isDragging.current && Math.abs(velocity.current.x) < 0.0001 && Math.abs(velocity.current.y) < 0.0001) {
        const autoRotQuat = new THREE.Quaternion().setFromAxisAngle(worldAxisY, delta * 0.3);
        targetQuaternion.current.premultiply(autoRotQuat);
      }
      
      // Apply momentum when not dragging
      if (!isDragging.current && (Math.abs(velocity.current.x) > 0.0001 || Math.abs(velocity.current.y) > 0.0001)) {
        const momentumQuatY = new THREE.Quaternion().setFromAxisAngle(worldAxisY, velocity.current.x);
        const momentumQuatX = new THREE.Quaternion().setFromAxisAngle(worldAxisX, velocity.current.y);
        
        targetQuaternion.current.premultiply(momentumQuatY);
        targetQuaternion.current.premultiply(momentumQuatX);
        
        // Damping
        velocity.current.x *= 0.95;
        velocity.current.y *= 0.95;
      }
      
      // Smooth interpolation using slerp
      groupRef.current.quaternion.slerp(targetQuaternion.current, 0.15);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Optimized: Single heightmap for all 6 faces! */}
      <ReliefCube
        nodes={preset.nodes}
        connections={preset.connections}
        colorRampStops={preset.colorRamp}
        paused={false}
        resolutionOverride={preset.gridResolution}
        cubeSize={cubeSize}
      />
    </group>
  );
};

const ReflowCubePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const presetId = parseInt(id || '1', 10);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const cameraAttempted = useRef(false);
  
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

      {/* Camera Toggle Button - center bottom */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
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
      
      {/* 3D Canvas - fixed camera, drag to rotate cube */}
      <Canvas 
        gl={{ preserveDrawingBuffer: true, antialias: true, alpha: true }}
        style={{ background: cameraActive ? 'transparent' : 'black' }}
      >
        <PerspectiveCamera makeDefault position={[0, 5, 35]} fov={40} />
        
        <ambientLight intensity={1.5} />
        {/* Main key light from front-top */}
        <directionalLight position={[0, 15, 20]} intensity={1.5} />
        {/* Fill light from left */}
        <directionalLight position={[-15, 10, 5]} intensity={0.8} />
        {/* Rim light from back */}
        <pointLight position={[10, 10, -15]} intensity={0.6} color="#4facfe" />
        
        {/* 6-Face Pattern Cube - positioned toward top */}
        <group position={[0, 10, 0]} scale={0.5}>
          <DraggableCube preset={preset} cubeSize={5} />
        </group>
        
      </Canvas>
    </div>
  );
};

export default ReflowCubePage;
