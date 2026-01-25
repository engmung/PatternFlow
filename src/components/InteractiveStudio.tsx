import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Palette, Play, Pause, RefreshCw, HelpCircle, X, Share2 } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { ReliefGrid } from '../studio/ReliefGrid';
import { TextureCanvas } from '../studio/TextureCanvas';
import { DEMO_PRESETS, DEMO_PRESET } from '../presets/demoPreset';
import { Node, Connection, ColorRampStop, NodeType } from '../studio/types';
import { getPresetFromUrl, clearPatternFromUrl, generateShareUrl, copyToClipboard } from '../utils/urlSharing';

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
  const [customPreset, setCustomPreset] = useState<typeof DEMO_PRESETS[0] | null>(null);
  const [isCustomActive, setIsCustomActive] = useState(false);
  
  // Determine current preset: either custom (from URL) or demo
  const currentPreset = isCustomActive && customPreset ? customPreset : DEMO_PRESETS[activePresetIndex];

  const [nodes, setNodes] = useState<Node[]>(currentPreset.nodes);
  const [connections, setConnections] = useState<Connection[]>(currentPreset.connections);
  const [colors, setColors] = useState<ColorRampStop[]>(currentPreset.colorRamp);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [resolution, setResolution] = useState(40);
  const [layerHeight, setLayerHeight] = useState(0.2);
  const [aspect, setAspect] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const urlPresetLoadedRef = useRef(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  
  // Custom Color Editor State
  const gradientRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const editingIndexRef = useRef<number | null>(null); // Use ref for synchronous access
  const [editingIndex, setEditingIndex] = useState<number | null>(null); // Keep state for forcing re-renders if needed, but ref is primary for picker linkage
  
  // Context Menu & Help State
  const [activeHandleIndex, setActiveHandleIndex] = useState<number | null>(null);
  const [showColorHelp, setShowColorHelp] = useState(false);
  const helpPopupRef = useRef<HTMLDivElement>(null);

  // Close Help when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (helpPopupRef.current && !helpPopupRef.current.contains(event.target as any)) {
        setShowColorHelp(false);
      }
    };
    if (showColorHelp) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColorHelp]);

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

  // Load preset from URL on mount
  useEffect(() => {
    const urlPreset = getPresetFromUrl();
    if (urlPreset) {
      urlPresetLoadedRef.current = true;
      
      // Create a custom preset from URL data
      const sharedPreset: typeof DEMO_PRESETS[0] = {
        id: 'shared',
        name: 'Shared',
        description: 'Pattern loaded from shared URL',
        author: 'Community',
        version: 1,
        nodes: urlPreset.nodes,
        connections: urlPreset.connections,
        colorRamp: urlPreset.colorRamp,
        parameters: urlPreset.nodes
          .filter(n => n.type === NodeType.PARAMETER)
          .map(n => ({
            id: `param-${n.id}`,
            label: n.data.label || 'Param',
            nodeId: n.id,
            property: 'value',
            min: n.data.min ?? 0,
            max: n.data.max ?? 10,
            default: n.data.value ?? 5,
            step: n.data.spread ?? 0.1,
            sensitivity: 1
          })),
        gridResolution: urlPreset.gridResolution ?? 40
      };
      
      setCustomPreset(sharedPreset);
      setIsCustomActive(true);
      setNodes(sharedPreset.nodes);
      setConnections(sharedPreset.connections);
      setColors(sharedPreset.colorRamp);
      if (urlPreset.gridResolution) setResolution(urlPreset.gridResolution);
      
      // Initialize param values
      const initialParams: Record<string, number> = {};
      sharedPreset.parameters.forEach(p => {
        initialParams[p.id] = p.default;
      });
      setParamValues(initialParams);
    }
  }, []);

  // Parameter State
  const [paramValues, setParamValues] = useState<Record<string, number>>({});

  // Reset Engine State when Preset Changes (but not if URL preset was loaded)
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  
  useEffect(() => {
      // Skip on first render if URL preset was loaded
      if (!initialLoadDone) {
        setInitialLoadDone(true);
        if (urlPresetLoadedRef.current) return; // Check ref synchronously
      }
      
      // Determine which preset to load
      let preset = DEMO_PRESETS[activePresetIndex];
      
      // If custom/shared tab is active and we have a custom preset, use it
      if (isCustomActive && customPreset) {
          preset = customPreset;
      }
      
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
  }, [activePresetIndex, isCustomActive, customPreset]);

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
        // Speed is now handled via simulation prop, so we DO NOT update node data
        
        // Update Resolution & Height
        if (n.type === NodeType.OUTPUT) {
             if (n.data.resolution !== resolution || n.data.layerHeight !== layerHeight) {
                 return { ...n, data: { ...n.data, resolution, layerHeight } };
             }
        }
        return n;
    }));
  }, [paramValues, resolution, layerHeight, currentPreset]); // Removed speed from dependency

  const handleParamChange = (paramId: string, val: number) => {
      setParamValues(prev => ({ ...prev, [paramId]: val }));
  };

  const randomizeColors = useCallback(() => {
    const harmony = Math.floor(Math.random() * 4); // 0: Mono, 1: Analogous, 2: Complimentary, 3: Vibrant
    const baseHue = Math.floor(Math.random() * 360);
    const baseS = 40 + Math.random() * 40; // 40-80% saturation baseline
    const invert = Math.random() > 0.5; // 50% chance to be Light -> Dark

    setColors(prevColors => prevColors.map((stop, i) => {
        const count = Math.max(1, prevColors.length - 1);
        let t = i / count; // 0.0 to 1.0
        
        // If inverted, flip the lightness gradient direction
        if (invert) t = 1.0 - t;

        let h = baseHue;
        let s = baseS;
        let l = 50;

        switch(harmony) {
            case 1: // Analogous (Calm, nature-like)
                h = (baseHue + t * 40) % 360; 
                s = 40 + Math.random() * 20;
                l = 10 + t * 80; // Dark -> Light (or Light -> Dark if inverted)
                break;
            case 2: // Complimentary Gradient (Dynamic)
                h = (baseHue + t * 180) % 360; 
                s = 70;
                l = 20 + t * 60; 
                break;
            case 3: // Vibrant/Neon (High contrast)
                h = (baseHue + t * 120) % 360; 
                s = 80 + Math.random() * 20;
                // Complex curve: Dark edges, bright center OR Bright edges, dark center
                // Let's keep it simpler but impactful
                l = t < 0.5 ? 10 + t * 40 : 50 + (t - 0.5) * 40; 
                break;
            case 0: // Rich Monochromatic (Classy)
            default:
                h = (baseHue + Math.random() * 10 - 5) % 360; 
                s = baseS;
                l = 10 + Math.pow(t, 0.8) * 85; 
                break;
        }
        
        return {
            ...stop,
            color: hslToHex(h, s, l)
        };
    }));
  }, []);

  const resetColors = useCallback(() => {
    setColors(currentPreset.colorRamp);
  }, [currentPreset]);

  // Share URL Handler 
  const handleShareUrl = useCallback(async () => {
    // Ensure TimeNode has the current speed before sharing
    const updatedNodes = nodes.map(n => {
        if (n.type === NodeType.TIME) {
            return { ...n, data: { ...n.data, speed } };
        }
        return n;
    });

    const shareUrl = generateShareUrl({
      nodes: updatedNodes,
      connections,
      colorRamp: colors,
      gridResolution: resolution
    });
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setShareMessage('URL Copied!');
    } else {
      setShareMessage('Failed');
    }
    setTimeout(() => setShareMessage(null), 2500);
  }, [nodes, connections, colors, resolution, speed]);

  // Color Editor Handlers
  const handleStopDrag = useCallback((e: MouseEvent) => {
    if (draggingIndex === null || !gradientRef.current) return;
    const rect = gradientRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const position = Math.max(0, Math.min(1, x / rect.width));
    
    setColors(prev => {
        const newColors = [...prev];
        newColors[draggingIndex] = { ...newColors[draggingIndex], position };
        return newColors.sort((a, b) => a.position - b.position); // Keep sorted? Or let them cross? Let's sort for safety.
        // Actually sorting while dragging can cause index jumps (swapping). 
        // Better to NOT sort during drag or map index carefully. 
        // For simplicity, let's just update position. Sorting might jitter the UI.
        // But the gradient render depends on sort.
        // Let's NOT sort during drag, only update position.
    });
  }, [draggingIndex]);

  const handleStopDragEnd = useCallback(() => {
    setDraggingIndex(null);
  }, []);

  useEffect(() => {
    if (draggingIndex !== null) {
        window.addEventListener('mousemove', handleStopDrag);
        window.addEventListener('mouseup', handleStopDragEnd);
        return () => {
            window.removeEventListener('mousemove', handleStopDrag);
            window.removeEventListener('mouseup', handleStopDragEnd);
        };
    }
  }, [draggingIndex, handleStopDrag, handleStopDragEnd]);

  const handleColorPick = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (editingIndexRef.current !== null) {
          const targetIdx = editingIndexRef.current;
          setColors(prev => {
              const newColors = [...prev];
              // Ensure index is valid
              if (newColors[targetIdx]) {
                  newColors[targetIdx] = { ...newColors[targetIdx], color: e.target.value };
              }
              return newColors;
          });
      }
  };

  const gradientStyle = useMemo(() => {
    const sorted = [...colors].sort((a, b) => a.position - b.position);
    const colorStops: string[] = [];
    sorted.forEach((stop, i) => {
      const pos = stop.position * 100;
      const nextPos = i < sorted.length - 1 ? sorted[i + 1].position * 100 : 100;
      colorStops.push(`${stop.color} ${pos}%`, `${stop.color} ${nextPos}%`);
    });
    return `linear-gradient(to right, ${colorStops.join(', ')})`;
  }, [colors]);

  return (
    <>
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
                        onClick={() => {
                          setActivePresetIndex(idx);
                          setIsCustomActive(false);
                        }}
                        className={`flex-1 py-1 text-xs uppercase tracking-wider font-medium border rounded transition-colors ${
                            !isCustomActive && activePresetIndex === idx 
                            ? "bg-white text-black border-white" 
                            : "bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300"
                        }`}
                    >
                        {preset.name}
                    </button>
                 ))}
                 {/* Shared Preset Tab (only visible when loaded from URL) */}
                 {customPreset && (
                    <button
                        onClick={() => setIsCustomActive(true)}
                        className={`flex-1 py-1 text-xs uppercase tracking-wider font-medium border rounded transition-colors ${
                            isCustomActive 
                            ? "bg-blue-500 text-white border-blue-500" 
                            : "bg-transparent text-blue-400 border-blue-800 hover:border-blue-600 hover:text-blue-300"
                        }`}
                    >
                        Shared
                    </button>
                 )}
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
                
                {/* 1. Preset Parameters Group */}
                <div className="mb-6">
                   <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-4">Pattern Tuning</h3>
                   {currentPreset.parameters.map((param, idx) => (
                      <div key={param.id} className="mb-3 group">
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-xs uppercase tracking-widest text-gray-300 font-medium group-hover:text-white transition-colors">
                            {param.label}
                          </label>
                          <span className="text-xs font-mono text-gray-400 group-hover:text-white">
                              {(paramValues[param.id] ?? param.default).toFixed(2)}
                          </span>
                        </div>
                        <div className="relative h-4 flex items-center">
                          <input
                            type="range"
                            min={param.min}
                            max={param.max}
                            step={0.001}
                            value={paramValues[param.id] ?? param.default}
                            onChange={(e) => handleParamChange(param.id, parseFloat(e.target.value))}
                            className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-grab active:cursor-grabbing focus:outline-none slider-thumb"
                          />
                        </div>
                      </div>
                  ))}
                  
                  {/* Fallback */}
                  {currentPreset.parameters.length === 0 && (
                      <div className="text-xs text-zinc-600 text-center py-2 mb-2">No adjustable parameters</div>
                  )}
                </div>

                <div className="h-px bg-zinc-800 w-full mb-6"></div>

                {/* 2. Grid Settings Group */}
                <div className="mb-2">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-4">Grid Settings</h3>
                    
                    {/* Resolution */}
                    <div className="mb-3 group">
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="text-xs uppercase tracking-widest text-gray-300 font-medium group-hover:text-white transition-colors">
                            Grid Resolution
                            </label>
                            <span className="text-xs font-mono text-gray-400 group-hover:text-white">{resolution}</span>
                        </div>
                        <div className="relative h-4 flex items-center">
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

                    {/* Height */}
                    <div className="mb-3 group">
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="text-xs uppercase tracking-widest text-gray-300 font-medium group-hover:text-white transition-colors">
                            Height Scale
                            </label>
                            <span className="text-xs font-mono text-gray-400 group-hover:text-white">{layerHeight.toFixed(2)}</span>
                        </div>
                        <div className="relative h-4 flex items-center">
                            <input
                            type="range"
                            min={0.01}
                            max={5}
                            step={0.001}
                            value={layerHeight}
                            onChange={(e) => setLayerHeight(parseFloat(e.target.value))}
                            className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                            />
                        </div>
                    </div>
                </div>

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
                      min={-10}
                      max={10}
                      step={0.01}
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

            <div className="flex items-center justify-between mt-2">
                <h3 className="text-xs font-mono uppercase tracking-widest text-white">Color Palette</h3>
                 <div className="relative" ref={helpPopupRef}>
                    <button 
                        onClick={() => setShowColorHelp(!showColorHelp)}
                        className={`text-zinc-500 hover:text-white transition-colors ${showColorHelp ? "text-white" : ""}`}
                        title="How to edit"
                    >
                        <HelpCircle size={16} />
                    </button>
                    {/* Help Popup */}
                    {showColorHelp && (
                        <div className="absolute bottom-full right-0 mb-3 w-64 bg-zinc-900 border border-zinc-700 p-4 rounded-lg shadow-2xl z-[60]">
                            <ul className="space-y-3 text-zinc-300 text-xs leading-relaxed">
                                <li className="flex gap-3">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                  <span><strong>Click Handle</strong> to Change Color or Delete layer.</span>
                                </li>
                                <li className="flex gap-3">
                                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 mt-1.5 shrink-0" />
                                  <span><strong>Drag Handle</strong> to adjust position.</span>
                                </li>
                                <li className="flex gap-3">
                                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 mt-1.5 shrink-0" />
                                  <span><strong>Click Bar</strong> on empty space to Add layer.</span>
                                </li>
                            </ul>
                        </div>
                    )}
                 </div>
            </div>

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
            
            {/* Embedded Interactive Palette */}
            <div className="relative pt-2 pb-1">
                {/* Hidden Color Input for Picker */}
                <input 
                    type="color" 
                    ref={colorInputRef} 
                    className="absolute opacity-0 pointer-events-none"
                    onChange={handleColorPick}
                />

                {/* Gradient Bar Area */}
                <div 
                    ref={gradientRef}
                    className="h-6 w-full rounded-sm relative cursor-crosshair border border-zinc-800 bg-zinc-900"
                    style={{ background: gradientStyle }}
                    onClick={(e) => {
                        // If menu is open, close it
                        if (activeHandleIndex !== null) {
                            setActiveHandleIndex(null);
                            return;
                        }

                        // Otherwise add new stop
                        if (e.target === gradientRef.current && colors.length < 8) {
                             const rect = gradientRef.current.getBoundingClientRect();
                             const x = e.clientX - rect.left;
                             const position = Math.max(0, Math.min(1, x / rect.width));
                             
                             setColors([...colors, { position, color: '#888888' }]);
                        }
                    }}
                >
                    {/* Draggable Handles */}
                    {colors.map((stop, idx) => (
                        <div 
                            key={idx} 
                            className="absolute top-0 bottom-0 w-4 ml-[-8px] cursor-ew-resize hover:z-20 group flex justify-center"
                            style={{ left: `${stop.position * 100}%`, zIndex: activeHandleIndex === idx ? 30 : 10 }}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                setDraggingIndex(idx);
                                setActiveHandleIndex(null); // Close menu on drag start
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                // Toggle Menu
                                setActiveHandleIndex(activeHandleIndex === idx ? null : idx);
                            }}
                        >
                            {/* Minimal Line Handle */}
                            <div className={`w-px h-full transition-colors shadow-[0_0_2px_rgba(0,0,0,0.8)] ${activeHandleIndex === idx ? "bg-blue-400 w-0.5" : "bg-white/70 group-hover:bg-white"}`} />
                            
                            {/* Context Menu */}
                            {activeHandleIndex === idx && (
                                <div 
                                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#1a1a1a] border border-zinc-700 rounded-md shadow-2xl flex p-1 gap-1 z-50 cursor-default min-w-[80px]" 
                                    onClick={e => e.stopPropagation()}
                                    onMouseDown={e => e.stopPropagation()}
                                >
                                    {/* Color Swatch Button */}
                                    <button 
                                        className="flex-1 h-8 rounded bg-zinc-800 border-zinc-600 border hover:border-white transition-colors flex items-center justify-center relative group/btn"
                                        title="Change Color"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            editingIndexRef.current = idx;
                                            setActiveHandleIndex(null);
                                            if (colorInputRef.current) {
                                                colorInputRef.current.value = stop.color;
                                                colorInputRef.current.click();
                                            }
                                        }}
                                    >
                                        <div className="w-4 h-4 rounded-full border border-black/20 shadow-sm" style={{backgroundColor: stop.color}}></div>
                                    </button>
                                    
                                    {/* Delete Button */}
                                    <button 
                                        className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 hover:bg-red-900/30 hover:border-red-900/50 hover:text-red-400 text-zinc-500 transition-colors flex items-center justify-center"
                                        title={colors.length > 2 ? "Delete Layer" : "Cannot delete (min 2)"}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (colors.length > 2) {
                                                setColors(prev => prev.filter((_, i) => i !== idx));
                                            }
                                            setActiveHandleIndex(null);
                                        }}
                                        disabled={colors.length <= 2}
                                        style={{ opacity: colors.length <= 2 ? 0.3 : 1 }}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="contents md:flex md:flex-col md:col-span-8 lg:col-span-9 gap-6">
          
          {/* 4. 2D Preview (Swapped Internal Logic -> Isolated) */}
          <div className="order-2 md:order-none w-full h-48 bg-black rounded-lg border border-zinc-800 overflow-hidden relative shadow-inner shrink-0 fade-in-up" style={{ animationDelay: '0.3s' }}>
             {/* New Engine - Texture Mode (Isolated) */}
             <div ref={containerRef} className="w-full h-full" style={{ imageRendering: 'pixelated' }}>
                 <TextureCanvas 
                     nodes={nodes}
                     connections={connections}
                     paused={isPaused}
                     aspect={aspect}
                     speed={speed}
                 />
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
                        speed={speed}
                    />
                </Canvas>
            </div>
          </div>
        </div>
      </div>
    </section>

      {/* SHARE SECTION - Separate from main content */}
      <section className="w-full bg-zinc-950 py-12 px-6 md:px-12 border-t border-zinc-800" id="share">
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="text-lg md:text-xl font-mono uppercase tracking-widest text-white mb-3">Share Your Creation</h2>
          <p className="text-sm text-zinc-500 mb-6 max-w-md mx-auto">
            Copy a shareable link to let others experience your custom pattern.
          </p>
          <button 
            onClick={handleShareUrl}
            className="inline-flex items-center justify-center gap-3 py-4 px-8 text-sm uppercase font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors rounded-lg relative"
          >
            <Share2 size={18} />
            Copy Share URL
            {shareMessage && (
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-xs px-3 py-1.5 rounded whitespace-nowrap shadow-lg">
                {shareMessage}
              </span>
            )}
          </button>
        </div>
      </section>
    </>
  );
};

export default InteractiveStudio;
