import React, { useState, useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Palette, Play, Pause, RefreshCw } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { ReliefGrid } from '../studio/ReliefGrid';
import { DEMO_PRESETS, DEMO_PRESET } from '../presets/demoPreset';
import { Node, Connection, ColorRampStop, NodeType } from '../studio/types';

// Utility for colors
const hslToHex = (h: number, s: number, l: number) => {
  h = h % 360;
  if (h < 0) h += 360;
  s = Math.max(0, Math.min(100, s));
  l = Math.max(0, Math.min(100, l));
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const DEFAULT_COLORS = ['#1a1a1a', '#4a4a4a', '#888888', '#ffffff'];

const InteractiveStudio: React.FC = () => {
  const [activePresetIndex, setActivePresetIndex] = useState(0);
  const currentPreset = DEMO_PRESETS[activePresetIndex];

  const [nodes, setNodes] = useState<Node[]>(currentPreset.nodes);
  const [connections, setConnections] = useState<Connection[]>(currentPreset.connections);
  const [colors, setColors] = useState<ColorRampStop[]>(currentPreset.colorRamp);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [resolution, setResolution] = useState(40);
  const [layerHeight, setLayerHeight] = useState(0.2);
  const [aspect, setAspect] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Measure aspect ratio for 2D view
  useEffect(() => {
    if (!containerRef.current) return;
    const updateAspect = () => {
      if (containerRef.current) {
        setAspect(containerRef.current.clientWidth / containerRef.current.clientHeight);
      }
    };
    updateAspect();
    window.addEventListener('resize', updateAspect);
    return () => window.removeEventListener('resize', updateAspect);
  }, []);

  // Parameter State
  const [paramValues, setParamValues] = useState<Record<string, number>>({});

  // Reset Engine State when Preset Changes
  useEffect(() => {
      const preset = DEMO_PRESETS[activePresetIndex];
      setNodes(preset.nodes);
      setConnections(preset.connections);
      setColors(preset.colorRamp);
      
      // Reset Params
      const initialParams: Record<string, number> = {};
      preset.parameters.forEach(p => {
         initialParams[p.id] = p.default;
      });
      setParamValues(initialParams);

      // Reset Settings
      const timeNode = preset.nodes.find(n => n.type === NodeType.TIME);
      if (timeNode?.data.speed) setSpeed(timeNode.data.speed);

      const outNode = preset.nodes.find(n => n.type === NodeType.OUTPUT);
      if (outNode) {
          if (outNode.data.resolution) setResolution(outNode.data.resolution);
          if (outNode.data.layerHeight) setLayerHeight(outNode.data.layerHeight);
      }
      
      // Auto-play on switch
      setIsPaused(false);
  }, [activePresetIndex]);

  // Update Nodes on Param/Settings Change
  useEffect(() => {
    setNodes(prevNodes => prevNodes.map(n => {
        // Update Parameters
        const paramDef = currentPreset.parameters.find(p => p.nodeId === n.id);
        if (paramDef) {
             const val = paramValues[paramDef.id];
             if (val !== undefined && n.data.value !== val) {
                 return { ...n, data: { ...n.data, value: val } };
             }
        }
        // Update Speed
        if (n.type === NodeType.TIME) {
             if (n.data.speed !== speed) {
                 return { ...n, data: { ...n.data, speed: speed } };
             }
        }
        // Update Resolution & Height
        if (n.type === NodeType.OUTPUT) {
             if (n.data.resolution !== resolution || n.data.layerHeight !== layerHeight) {
                 return { ...n, data: { ...n.data, resolution, layerHeight } };
             }
        }
        return n;
    }));
  }, [paramValues, speed, resolution, layerHeight, currentPreset]);

  const handleParamChange = (paramId: string, val: number) => {
      setParamValues(prev => ({ ...prev, [paramId]: val }));
  };

  const randomizeColors = useCallback(() => {
    const baseHue = Math.floor(Math.random() * 360);
    const s = 50 + Math.random() * 40;
    const newColors = [
        hslToHex(baseHue, s * 0.4, 10),
        hslToHex(baseHue, s * 0.6, 30),
        hslToHex(baseHue, s * 0.8, 60),
        hslToHex(baseHue, s * 90, 90) // Typo fix in s calculation logic if needed, but keeping original logic
    ];
    // ... wait, original logic was hslToHex(baseHue, s, 90)
    const c4 = hslToHex(baseHue, s, 90);
    
    // Re-construct logic to match previous exactly or improve
    const customColors = [
        hslToHex(baseHue, s * 0.4, 10),
        hslToHex(baseHue, s * 0.6, 30),
        hslToHex(baseHue, s * 0.8, 60),
        c4
    ];

    setColors(customColors.map((c, i): ColorRampStop => ({
        position: i / (customColors.length - 1),
        color: c
    })));
  }, []);

  const resetColors = useCallback(() => {
    setColors(currentPreset.colorRamp);
  }, [currentPreset]);

  return (
    <section className="w-full min-h-screen bg-black py-6 px-6 md:px-12" id="process">
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN */}
        <div className="contents md:flex md:flex-col md:col-span-4 lg:col-span-3 gap-6">
          
          {/* 1. Heading + Preset Switcher */}
          <div className="order-1 md:order-none w-full fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="border-b border-zinc-800 pb-4 mb-6 md:mb-0">
              <h2 className="text-lg md:text-xl font-mono uppercase tracking-widest text-white mb-2">Play with Complexity</h2>
              <p className="text-xs text-zinc-500 font-mono uppercase tracking-tight mb-4">Select a pattern to explore</p>
              
              {/* Preset Switcher */}
              <div className="flex gap-2">
                 {DEMO_PRESETS.map((preset, idx) => (
                    <button
                        key={preset.id}
                        onClick={() => setActivePresetIndex(idx)}
                        className={`flex-1 py-1 text-xs uppercase tracking-wider font-medium border rounded transition-colors ${
                            activePresetIndex === idx 
                            ? "bg-white text-black border-white" 
                            : "bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300"
                        }`}
                    >
                        {preset.name}
                    </button>
                 ))}
              </div>
            </div>
          </div>

          {/* 2. Controls (Replaced PatternControls, matched styling) */}
          <div className="order-3 md:order-none w-full fade-in-up" style={{ animationDelay: '0.2s' }}>
             {/* Using the Styles from PatternControls.xml to ensure identical look */}
             <div className="w-full max-w-sm mt-8 p-6 bg-zinc-900 rounded-sm border border-zinc-800 shadow-sm">
                {/* ... style block ... */}
                <style>{`
                  .slider-thumb::-webkit-slider-thumb {
                    -webkit-appearance: none; appearance: none; width: 16px; height: 16px; background: #ffffff; border-radius: 50%; cursor: pointer; transition: transform 0.1s;
                  }
                  .slider-thumb::-webkit-slider-thumb:hover { transform: scale(1.2); }
                  .slider-thumb::-moz-range-thumb { width: 16px; height: 16px; background: #ffffff; border-radius: 50%; cursor: pointer; border: none; transition: transform 0.1s; }
                  .slider-thumb::-moz-range-thumb:hover { transform: scale(1.2); }
                `}</style>
                
                {/* Global Controls: Resolution & Height */}
                <div className="mb-6 group border-b border-zinc-800 pb-6">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs uppercase tracking-widest text-gray-300 font-medium group-hover:text-white transition-colors">
                          Grid Resolution
                        </label>
                        <span className="text-xs font-mono text-gray-400 group-hover:text-white">{resolution}</span>
                    </div>
                    <div className="relative h-6 flex items-center">
                        <input
                          type="range"
                          min={10}
                          max={100}
                          step={1}
                          value={resolution}
                          onChange={(e) => setResolution(parseInt(e.target.value))}
                          className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                        />
                    </div>
                </div>

                 <div className="mb-6 group border-b border-zinc-800 pb-6">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs uppercase tracking-widest text-gray-300 font-medium group-hover:text-white transition-colors">
                          Height Scale
                        </label>
                        <span className="text-xs font-mono text-gray-400 group-hover:text-white">{layerHeight.toFixed(2)}</span>
                    </div>
                    <div className="relative h-6 flex items-center">
                        <input
                          type="range"
                          min={0.01}
                          max={0.5}
                          step={0.01}
                          value={layerHeight}
                          onChange={(e) => setLayerHeight(parseFloat(e.target.value))}
                          className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                        />
                    </div>
                </div>

                {/* Mapping Preset Parameters to Sliders */}
                {currentPreset.parameters.map((param, idx) => (
                    <div key={param.id} className="mb-6 group">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs uppercase tracking-widest text-gray-300 font-medium group-hover:text-white transition-colors">
                          {param.label}
                        </label>
                        <span className="text-xs font-mono text-gray-400 group-hover:text-white">
                            {(paramValues[param.id] ?? param.default).toFixed(2)}
                        </span>
                      </div>
                      <div className="relative h-6 flex items-center">
                        <input
                          type="range"
                          min={param.min}
                          max={param.max}
                          step={param.step || 0.01}
                          value={paramValues[param.id] ?? param.default}
                          onChange={(e) => handleParamChange(param.id, parseFloat(e.target.value))}
                          className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-grab active:cursor-grabbing focus:outline-none slider-thumb"
                        />
                      </div>
                    </div>
                ))}
                
                {/* Fallback to show something if no params */}
                {currentPreset.parameters.length === 0 && (
                    <div className="text-xs text-zinc-600 text-center py-4">No adjustable parameters</div>
                )}

             </div>
          </div>

          {/* 3. Flow Control (Grouped Speed + Pause) */}
          <div className="order-4 md:order-none w-full bg-zinc-900/50 p-6 rounded-sm border border-zinc-800/50 flex flex-col gap-4 fade-in-up" style={{ animationDelay: '0.5s' }}>
            <h3 className="text-xs font-mono uppercase tracking-widest text-white">Flow Control</h3>
            
            {/* Speed Slider (Added here to group with pause) */}
             <div className="mb-2 group">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs uppercase tracking-widest text-gray-300 font-medium group-hover:text-white transition-colors">
                      Flow Speed
                    </label>
                    <span className="text-xs font-mono text-gray-400 group-hover:text-white">{speed.toFixed(1)}x</span>
                  </div>
                  <div className="relative h-6 flex items-center">
                    <input
                      type="range"
                      min={0.1}
                      max={3.0}
                      step={0.1}
                      value={speed}
                      onChange={(e) => setSpeed(parseFloat(e.target.value))}
                      className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                    />
                  </div>
            </div>

            <button 
              onClick={() => setIsPaused(!isPaused)}
              className={`flex items-center justify-center gap-2 w-full py-2 px-4 text-sm font-medium transition-colors border ${
                isPaused 
                ? 'bg-white text-black border-white hover:bg-gray-200' 
                : 'bg-transparent text-gray-300 border-zinc-700 hover:border-gray-400 hover:text-white'
              }`}
            >
              {isPaused ? <Play size={14} /> : <Pause size={14} />}
              {isPaused ? 'RESUME FLOW' : 'PAUSE FLOW'}
            </button>

            <div className="h-px bg-zinc-800/50 w-full my-1"></div>

            <h3 className="text-xs font-mono uppercase tracking-widest text-white mt-2">Color Palette</h3>

            <div className="flex gap-2">
              <button 
                onClick={randomizeColors}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs uppercase font-mono bg-transparent text-gray-300 border border-zinc-700 hover:border-white hover:text-white transition-colors rounded-sm"
              >
                <Palette size={14} /> Random
              </button>
              <button 
                onClick={resetColors}
                className="flex items-center justify-center py-2 px-3 text-xs uppercase font-mono bg-transparent text-gray-300 border border-zinc-700 hover:border-white hover:text-white transition-colors rounded-sm"
              >
                <RefreshCw size={14} />
              </button>
            </div>
            
            <div className="flex w-full h-4 rounded-sm overflow-hidden border border-zinc-800">
              {colors.map((c, i) => (
                <div key={i} className="flex-1 h-full" style={{ backgroundColor: c.color }} />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="contents md:flex md:flex-col md:col-span-8 lg:col-span-9 gap-6">
          
          {/* 4. 2D Preview (Swapped Internal Logic -> Isolated) */}
          <div className="order-2 md:order-none w-full h-48 bg-black rounded-lg border border-zinc-800 overflow-hidden relative shadow-inner shrink-0 fade-in-up" style={{ animationDelay: '0.3s' }}>
             {/* New Engine - Texture Mode (Isolated) */}
             <div ref={containerRef} className="w-full h-full" style={{ imageRendering: 'pixelated' }}>
                 <Canvas gl={{ preserveDrawingBuffer: false, antialias: false }} dpr={[1, 1.5]}>
                     <color attach="background" args={['#000000']} />
                     <PerspectiveCamera makeDefault position={[0, 40, 0]} fov={15} onUpdate={(c) => c.lookAt(0, 0, 0)} />
                     <ambientLight intensity={1} />
                     <ReliefGrid 
                         nodes={nodes}
                         connections={connections}
                         colorRampStops={colors}
                         paused={isPaused}
                         grayscaleMode={true}
                         variant="landing"
                         aspect={aspect}
                     />
                </Canvas>
             </div>
          </div>

          {/* 5. 3D Viewer (Swapped Internal Logic -> Isolated) */}
          <div className="order-3 md:order-none w-full h-[400px] md:h-auto md:flex-grow bg-black rounded-lg border border-zinc-800 overflow-hidden relative shadow-sm fade-in-up" style={{ animationDelay: '0.4s' }}>
             {/* New Engine - 3D Mode (Isolated) */}
             <div className="w-full h-full"> 
                 <Canvas
                    shadows
                    camera={{ position: [14, 14, 14], fov: 35 }}
                    gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
                 >
                     <color attach="background" args={['#000000']} />
                     <OrbitControls 
                        enablePan={false} 
                        enableZoom={false}
                        minPolarAngle={0} 
                        maxPolarAngle={Math.PI / 2.2}
                        minDistance={10}
                        maxDistance={50}
                        dampingFactor={0.05}
                        autoRotate={!isPaused}
                        autoRotateSpeed={0.5}
                     />

                    <ReliefGrid 
                        nodes={nodes}
                        connections={connections}
                        colorRampStops={colors}
                        paused={isPaused}
                        grayscaleMode={false}
                        variant="landing"
                    />
                </Canvas>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default InteractiveStudio;
