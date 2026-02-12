import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { ReliefGrid } from '../studio/ReliefGrid';
import { CuratedPreset } from '../types/Preset';
import { Node, Connection, ColorRampStop } from '../types/graph';
import { Sliders, RotateCcw } from 'lucide-react';

interface PatternViewerProps {
  preset: CuratedPreset;
}

export const PatternViewer: React.FC<PatternViewerProps> = ({ preset }) => {
  // We maintain local state of nodes to allow parameter updates
  const [nodes, setNodes] = useState<Node[]>(preset.nodes);
  const [connections] = useState<Connection[]>(preset.connections);
  const [colorRamp] = useState<ColorRampStop[]>(preset.colorRamp);
  const [paramValues, setParamValues] = useState<Record<string, number>>({});

  // Initialize param values from preset defaults (or current node values)
  useEffect(() => {
    const initial: Record<string, number> = {};
    preset.parameters.forEach(p => {
       initial[p.id] = p.default;
    });
    setParamValues(initial);
  }, [preset]);

  // Handle slider change
  const handleParamChange = useCallback((paramId: string, newValue: number) => {
    setParamValues(prev => ({ ...prev, [paramId]: newValue }));

    // Find the associated node and update only its value
    const paramDef = preset.parameters.find(p => p.id === paramId);
    if (!paramDef) return;

    setNodes(prevNodes => prevNodes.map(n => {
        if (n.id === paramDef.nodeId) {
            return {
                ...n,
                data: {
                    ...n.data,
                    value: newValue // Update the 'value' property
                }
            };
        }
        return n;
    }));
  }, [preset.parameters]);

  const handleReset = useCallback(() => {
     const initial: Record<string, number> = {};
     preset.parameters.forEach(p => {
        initial[p.id] = p.default;
     });
     setParamValues(initial);
     setNodes(preset.nodes); // Reset nodes to initial state
  }, [preset]);

  return (
    <div className="w-full h-full flex flex-col md:flex-row bg-black rounded-xl overflow-hidden border border-gray-800 shadow-2xl">
      
      {/* 3D Viewport */}
      <div className="flex-1 relative min-h-[400px]">
        <Canvas shadows gl={{ preserveDrawingBuffer: true }}>
             <PerspectiveCamera makeDefault position={[12, 12, 12]} fov={40} />
             <OrbitControls autoRotate autoRotateSpeed={0.5} dampingFactor={0.05} />
             
             <ambientLight intensity={0.6} />
             <directionalLight position={[10, 20, 10]} intensity={2.8} castShadow />

             <group position={[0, -2, 0]}>
                <ReliefGrid 
                    nodes={nodes}
                    connections={connections}
                    colorRampStops={colorRamp}
                    paused={false}
                    grayscaleMode={false}
                />
             </group>
             
             <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.1, 0]} receiveShadow>
                <planeGeometry args={[100, 100]} />
                <shadowMaterial opacity={0.25} />
             </mesh>
        </Canvas>
        
        <div className="absolute bottom-4 left-4 text-white/50 text-[10px] font-mono pointer-events-none">
            {preset.name} v{preset.version}
        </div>
      </div>

      {/* Controls Panel */}
      <div className="w-full md:w-80 bg-[#151515] p-6 border-l border-gray-800 flex flex-col gap-6 shrink-0 z-10">
         <div>
            <h2 className="text-xl text-white font-serif tracking-widest mb-1">{preset.name}</h2>
            <p className="text-xs text-gray-500 font-mono">{preset.description || "Interactive Generative Pattern"}</p>
         </div>

         <div className="space-y-6 overflow-y-auto custom-scrollbar flex-1">
             {preset.parameters.map(param => (
                 <div key={param.id} className="space-y-2">
                     <div className="flex justify-between items-center text-xs">
                         <span className="text-gray-300 font-bold uppercase tracking-wider flex items-center gap-2">
                            <Sliders size={12} className="text-blue-500" />
                            {param.label}
                         </span>
                         <span className="text-blue-400 font-mono">
                             {(paramValues[param.id] ?? param.default).toFixed(2)}
                         </span>
                     </div>
                     <input 
                        type="range"
                        min={param.min}
                        max={param.max}
                        step={param.step || 0.01}
                        value={paramValues[param.id] ?? param.default}
                        onChange={(e) => handleParamChange(param.id, parseFloat(e.target.value))}
                        className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-500 transition-all"
                     />
                     <div className="flex justify-between text-[10px] text-gray-600 font-mono">
                         <span>{param.min.toFixed(1)}</span>
                         <span>{param.max.toFixed(1)}</span>
                     </div>
                 </div>
             ))}
         </div>

         <button 
            onClick={handleReset}
            className="w-full py-3 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 rounded text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
        >
            <RotateCcw size={14} /> Reset Parameters
         </button>
      </div>

    </div>
  );
};
