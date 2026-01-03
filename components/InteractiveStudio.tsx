import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DEFAULT_CONFIG, PatternConfig, PatternType } from '../types';
import PatternControls from './PatternControls';
import ReliefViewer from './ReliefViewer';
import { noise } from '../utils/noise';
import { Palette, Play, Pause, RefreshCw } from 'lucide-react';

const DEFAULT_COLORS = ['#1a1a1a', '#4a4a4a', '#888888', '#ffffff'];

const InteractiveStudio: React.FC = () => {
  const [config, setConfig] = useState<PatternConfig>(DEFAULT_CONFIG);
  const [colors, setColors] = useState<string[]>(DEFAULT_COLORS);
  const [isPaused, setIsPaused] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const timeRef = useRef<number>(0);

  // Force a re-render of the 3D viewer when canvas is mounted
  const [, setMounted] = useState(false);

  // Memoize the setConfig callback to prevent re-renders
  const handleConfigChange = useCallback((newConfig: PatternConfig) => {
    setConfig(newConfig);
  }, []);

  // Helper to convert HSL to Hex
  const hslToHex = (h: number, s: number, l: number) => {
    // Normalize hue
    h = h % 360;
    if (h < 0) h += 360;
    
    // Clamp saturation and lightness
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

  const randomizeColors = () => {
    // Advanced Color Theory Generation
    const baseHue = Math.floor(Math.random() * 360);
    const strategies = [
      'monochromatic', 
      'analogous', 
      'complementary', 
      'split-complementary', 
      'triadic', 
      'tetradic'
    ];
    
    // Weighted selection to favor more harmonious palettes
    const strategy = strategies[Math.floor(Math.random() * strategies.length)];
    
    let newColors: string[] = [];

    // Helper to generate a ramp of lightness for depth (Dark -> Light)
    // Layer 0 (Base) -> Layer 3 (Top)
    // Since background is black, we generally want 0 to be dark and 3 to be light/highlight.
    
    if (strategy === 'monochromatic') {
      // Single hue, varying lightness and saturation
      const s = 40 + Math.random() * 40; // 40-80% saturation
      newColors = [
        hslToHex(baseHue, s * 0.5, 15), // Deep base
        hslToHex(baseHue, s * 0.7, 35), // Mid-dark
        hslToHex(baseHue, s * 0.9, 60), // Mid-light
        hslToHex(baseHue, s, 85)        // Highlight
      ];

    } else if (strategy === 'analogous') {
      // Neighbors on color wheel (+/- 30deg)
      const startHue = baseHue - 30;
      const s = 50 + Math.random() * 30;
      newColors = [
        hslToHex(startHue, s, 20),
        hslToHex(startHue + 20, s, 40),
        hslToHex(startHue + 40, s, 65),
        hslToHex(startHue + 60, s, 90)
      ];

    } else if (strategy === 'complementary') {
      // Base and its opposite (180deg)
      // Use Base for lower layers, Complement for accents/top
      const compHue = baseHue + 180;
      const s = 60;
      newColors = [
        hslToHex(baseHue, s * 0.5, 20),   // Dark Base
        hslToHex(baseHue, s, 45),         // Mid Base
        hslToHex(compHue, s, 70),         // Light Complement
        hslToHex(compHue, 20, 95)         // Desaturated Highlight
      ];

    } else if (strategy === 'split-complementary') {
      // Base + two colors adjacent to its complement (+150, +210)
      const h1 = baseHue + 150;
      const h2 = baseHue + 210;
      newColors = [
        hslToHex(baseHue, 60, 15), // Dark Base
        hslToHex(h1, 50, 45),      // Split 1
        hslToHex(h2, 50, 70),      // Split 2
        hslToHex(baseHue, 10, 95)  // Near White
      ];

    } else if (strategy === 'triadic') {
      // Three colors evenly spaced (0, 120, 240)
      const h1 = baseHue;
      const h2 = baseHue + 120;
      const h3 = baseHue + 240;
      newColors = [
        hslToHex(h1, 60, 20),
        hslToHex(h2, 60, 50),
        hslToHex(h3, 60, 70),
        hslToHex(h1, 20, 90) // Wash out the top
      ];

    } else if (strategy === 'tetradic') {
      // Double complementary (Rectangle): 0, 60, 180, 240
      // High variety, need to be careful with chaos. Keep saturation moderate.
      newColors = [
        hslToHex(baseHue, 50, 20),
        hslToHex(baseHue + 60, 50, 40),
        hslToHex(baseHue + 180, 50, 60),
        hslToHex(baseHue + 240, 50, 80)
      ];
    }

    // Randomly shuffle colors for more variety (Fisher-Yates shuffle)
    for (let i = newColors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newColors[i], newColors[j]] = [newColors[j], newColors[i]];
    }

    setColors(newColors);
  };

  const resetColors = () => {
    setColors(DEFAULT_COLORS);
  };

  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  const draw = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    // Performance optimization: using ImageData is faster for pixel manipulation
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    
    const { type, scale, roughness, speed } = config;
    
    // Adjust time based on speed only if not paused
    if (!isPaused) {
      timeRef.current += speed * 0.02;
    }
    const t = timeRef.current;

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const i = (x + y * width) * 4;
        
        // Normalize coordinates -1 to 1
        const nx = (x / width) * 2 - 1;
        const ny = (y / height) * 2 - 1;
        
        let value = 0;

        if (type === PatternType.NOISE) {
          // Perlin-ish Noise
          const n1 = noise.noise3D(nx * scale, ny * scale, t);
          const n2 = noise.noise3D(nx * scale * 2 + 10, ny * scale * 2 + 10, t * 1.5) * roughness;
          
          value = (n1 + n2 * 0.5); 
          value = (value + 1) / 2;
          
        } else if (type === PatternType.RING_WAVE) {
          // Ring Wave
          const dist = Math.sqrt(nx * nx + ny * ny);
          const wave = Math.sin(dist * scale * 5 - t * 2);
          const rough = noise.noise3D(nx * 10, ny * 10, t) * roughness * 0.5;
          
          value = (wave + 1) / 2 + rough;
        }

        // Clamp 0-1
        value = Math.max(0, Math.min(1, value));
        
        // Contrast curve
        value = Math.pow(value, 1.2);

        const pixelVal = Math.floor(value * 255);
        
        data[i] = pixelVal;     // R
        data[i + 1] = pixelVal; // G
        data[i + 2] = pixelVal; // B
        data[i + 3] = 255;      // Alpha
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [config, isPaused]);

  const animate = useCallback(() => {
    draw(performance.now());
    requestRef.current = requestAnimationFrame(animate);
  }, [draw]);

  useEffect(() => {
    // Initial setup
    if (canvasRef.current) {
        canvasRef.current.width = 256; 
        canvasRef.current.height = 256;
        setMounted(true);
    }
    
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  return (
    <section className="w-full min-h-screen bg-black py-10 px-6 md:px-12" id="process">
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Wrapper: Controls & Actions */}
        {/* On mobile: contents (flattened). On desktop: flex col */}
        <div className="contents md:flex md:flex-col md:col-span-4 lg:col-span-3 gap-6">
          
          {/* 1. CONTROLS (Mobile Order: 1) */}
          <div className="order-1 md:order-none w-full fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="border-b border-zinc-800 pb-4 mb-6">
              <h2 className="text-sm font-mono uppercase tracking-widest text-gray-500 mb-1">
                Configuration
              </h2>
            </div>
            <PatternControls config={config} onChange={handleConfigChange} />
          </div>

          {/* 4. ACTIONS (Mobile Order: 4) */}
          <div className="order-4 md:order-none w-full bg-zinc-900 p-6 rounded-sm border border-zinc-800 flex flex-col gap-4 fade-in-up" style={{ animationDelay: '0.5s' }}>
            <h3 className="text-xs font-mono uppercase tracking-widest text-gray-500">Actions</h3>
            
            <button 
              onClick={togglePause}
              className={`flex items-center justify-center gap-2 w-full py-2 px-4 text-sm font-medium transition-colors border ${
                isPaused 
                ? 'bg-white text-black border-white hover:bg-gray-200' 
                : 'bg-transparent text-gray-300 border-zinc-700 hover:border-gray-400 hover:text-white'
              }`}
            >
              {isPaused ? <Play size={14} /> : <Pause size={14} />}
              {isPaused ? 'RESUME FLOW' : 'PAUSE FLOW'}
            </button>

            <div className="h-px bg-zinc-800 w-full my-1"></div>

             <h3 className="text-xs font-mono uppercase tracking-widest text-gray-500 mt-2">Palette</h3>

            <div className="flex gap-2">
               <button 
                  onClick={randomizeColors}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs uppercase font-mono bg-transparent text-gray-300 border border-zinc-700 hover:border-white hover:text-white transition-colors rounded-sm"
                  title="Randomize Harmonious Palette"
                >
                  <Palette size={14} /> Random
                </button>
                <button 
                  onClick={resetColors}
                  className="flex items-center justify-center py-2 px-3 text-xs uppercase font-mono bg-transparent text-gray-300 border border-zinc-700 hover:border-white hover:text-white transition-colors rounded-sm"
                  title="Reset to Grayscale"
                >
                  <RefreshCw size={14} />
                </button>
            </div>
            
            {/* Color Preview */}
            <div className="flex w-full h-4 rounded-sm overflow-hidden border border-zinc-800">
                {colors.map((c, i) => (
                    <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }} />
                ))}
            </div>
          </div>
        </div>

        {/* Right Wrapper: Canvas & Viewer */}
        {/* On mobile: contents (flattened). On desktop: flex col, fixed height */}
        <div className="contents md:flex md:flex-col md:col-span-8 lg:col-span-9 gap-6 md:h-[85vh]">
          
          {/* 2. 2D PREVIEW (Mobile Order: 2) */}
          <div className="order-2 md:order-none w-full h-48 bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden relative shadow-inner shrink-0 fade-in-up" style={{ animationDelay: '0.3s' }}>
             <canvas 
                ref={canvasRef} 
                className="w-full h-full object-cover rendering-pixelated opacity-80 hover:opacity-100 transition-opacity"
                style={{ imageRendering: 'pixelated' }}
              />
          </div>

          {/* 3. 3D VIEWER (Mobile Order: 3) */}
          <div className="order-3 md:order-none w-full h-[400px] md:h-auto md:flex-grow bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden relative shadow-sm fade-in-up" style={{ animationDelay: '0.4s' }}>
             <ReliefViewer canvasRef={canvasRef} config={config} colors={colors} />
          </div>

        </div>
      </div>
    </section>
  );
};

export default InteractiveStudio;