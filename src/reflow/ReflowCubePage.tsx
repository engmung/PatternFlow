import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Box } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import SEO from '../components/SEO';
import { ReliefGrid } from '../studio/ReliefGrid';
import { getCubePresetById, cubePresetExists } from './cubePresets';

const ReflowCubePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const presetId = parseInt(id || '1', 10);
  
  const preset = useMemo(() => getCubePresetById(presetId), [presetId]);
  const exists = cubePresetExists(presetId);

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
    <div className="w-screen h-screen bg-black">
      <SEO title={`Cube #${presetId}`} description="Patternflow Cube" />
      
      {/* Minimal Logo - matching Navbar position */}
      <div className="fixed top-0 left-0 z-50 px-6 py-4 md:px-12">
        <Link to="/" className="font-serif text-xl md:text-2xl tracking-widest text-white font-medium hover:opacity-80 transition-opacity">
          PATTERNFLOW<span className="text-white/50"> : reflow</span>
        </Link>
      </div>
      
      <Canvas shadows gl={{ preserveDrawingBuffer: true, antialias: true }}>
        <PerspectiveCamera makeDefault position={[15, 15, 15]} fov={40} />
        <OrbitControls 
          makeDefault 
          autoRotate 
          autoRotateSpeed={0.5} 
          enablePan={false}
          minDistance={10}
          maxDistance={40}
        />
        
        <ambientLight intensity={0.3} />
        <directionalLight 
          position={[10, 20, 10]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize={[2048, 2048]}
        />
        <pointLight position={[-10, 10, -10]} intensity={0.5} color="#4facfe" />
        
        <Environment preset="city" background={false} />
        
        <ReliefGrid
          nodes={preset.nodes}
          connections={preset.connections}
          colorRampStops={preset.colorRamp}
          paused={false}
          grayscaleMode={false}
          variant="landing"
          resolutionOverride={preset.gridResolution}
        />
        
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
          <planeGeometry args={[50, 50]} />
          <shadowMaterial opacity={0.3} />
        </mesh>
      </Canvas>
    </div>
  );
};

export default ReflowCubePage;
