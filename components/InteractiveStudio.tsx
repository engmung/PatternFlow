import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DEFAULT_CONFIG, PatternConfig, PatternType } from '../types';
import PatternControls from './PatternControls';
import ReliefViewer from './ReliefViewer';
import { Palette, Play, Pause, RefreshCw } from 'lucide-react';
import * as THREE from 'three';

const DEFAULT_COLORS = ['#1a1a1a', '#4a4a4a', '#888888', '#ffffff'];

// GLSL Simplex Noise
const noiseGLSL = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

const fragmentShader = `
  ${noiseGLSL}
  uniform float uTime;
  uniform float uScale;
  uniform float uRoughness;
  uniform int uPatternType;
  uniform float uAspect;
  varying vec2 vUv;
  
  void main() {
    // Correct for aspect ratio to maintain square pattern
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= uAspect;
    
    float value = 0.0;
    
    if (uPatternType == 0) {
      float n1 = snoise(vec3(uv * uScale, uTime));
      float n2 = snoise(vec3(uv * uScale * 2.0 + 10.0, uTime * 1.5)) * uRoughness;
      value = (n1 + n2 * 0.5 + 1.0) / 2.0;
    } else {
      float dist = length(uv);
      float wave = sin(dist * uScale * 5.0 - uTime * 2.0);
      float rough = snoise(vec3(uv * 10.0, uTime)) * uRoughness * 0.5;
      value = (wave + 1.0) / 2.0 + rough;
    }
    
    value = clamp(value, 0.0, 1.0);
    value = pow(value, 1.2);
    gl_FragColor = vec4(vec3(value), 1.0);
  }
`;

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// GPU 2D Preview Renderer
const GPU2DPreview: React.FC<{ config: PatternConfig; isPaused: boolean }> = ({ config, isPaused }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const timeRef = useRef(0);
  const animationRef = useRef<number>(0);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    const aspect = width / height;

    const renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    renderer.domElement.style.imageRendering = 'pixelated';
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
    camera.position.z = 1;
    cameraRef.current = camera;

    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uScale: { value: config.scale },
        uRoughness: { value: config.roughness },
        uPatternType: { value: config.type === PatternType.NOISE ? 0 : 1 },
        uAspect: { value: aspect },
      },
    });
    materialRef.current = material;

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    return () => {
      cancelAnimationFrame(animationRef.current);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uScale.value = config.scale;
    materialRef.current.uniforms.uRoughness.value = config.roughness;
    materialRef.current.uniforms.uPatternType.value = config.type === PatternType.NOISE ? 0 : 1;
  }, [config]);

  useEffect(() => {
    const animate = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !materialRef.current) return;
      
      if (!isPaused) {
        timeRef.current += config.speed * 0.02;
      }
      materialRef.current.uniforms.uTime.value = timeRef.current;
      
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [config.speed, isPaused]);

  return <div ref={containerRef} className="w-full h-full" style={{ imageRendering: 'pixelated' }} />;
};

const InteractiveStudio: React.FC = () => {
  const [config, setConfig] = useState<PatternConfig>(DEFAULT_CONFIG);
  const [colors, setColors] = useState<string[]>(DEFAULT_COLORS);
  const [isPaused, setIsPaused] = useState(false);

  const handleConfigChange = useCallback((newConfig: PatternConfig) => {
    setConfig(newConfig);
  }, []);

  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

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

  const randomizeColors = () => {
    const baseHue = Math.floor(Math.random() * 360);
    const strategies = ['monochromatic', 'analogous', 'complementary', 'split-complementary', 'triadic', 'tetradic'];
    const strategy = strategies[Math.floor(Math.random() * strategies.length)];
    let newColors: string[] = [];
    
    if (strategy === 'monochromatic') {
      const s = 40 + Math.random() * 40;
      newColors = [hslToHex(baseHue, s * 0.5, 15), hslToHex(baseHue, s * 0.7, 35), hslToHex(baseHue, s * 0.9, 60), hslToHex(baseHue, s, 85)];
    } else if (strategy === 'analogous') {
      const startHue = baseHue - 30;
      const s = 50 + Math.random() * 30;
      newColors = [hslToHex(startHue, s, 20), hslToHex(startHue + 20, s, 40), hslToHex(startHue + 40, s, 65), hslToHex(startHue + 60, s, 90)];
    } else if (strategy === 'complementary') {
      const compHue = baseHue + 180;
      const s = 60;
      newColors = [hslToHex(baseHue, s * 0.5, 20), hslToHex(baseHue, s, 45), hslToHex(compHue, s, 70), hslToHex(compHue, 20, 95)];
    } else if (strategy === 'split-complementary') {
      newColors = [hslToHex(baseHue, 60, 15), hslToHex(baseHue + 150, 50, 45), hslToHex(baseHue + 210, 50, 70), hslToHex(baseHue, 10, 95)];
    } else if (strategy === 'triadic') {
      newColors = [hslToHex(baseHue, 60, 20), hslToHex(baseHue + 120, 60, 50), hslToHex(baseHue + 240, 60, 70), hslToHex(baseHue, 20, 90)];
    } else {
      newColors = [hslToHex(baseHue, 50, 20), hslToHex(baseHue + 60, 50, 40), hslToHex(baseHue + 180, 50, 60), hslToHex(baseHue + 240, 50, 80)];
    }

    for (let i = newColors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newColors[i], newColors[j]] = [newColors[j], newColors[i]];
    }
    setColors(newColors);
  };

  const resetColors = () => setColors(DEFAULT_COLORS);

  return (
    <section className="w-full min-h-screen bg-black py-6 px-6 md:px-12" id="process">
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
        
        <div className="contents md:flex md:flex-col md:col-span-4 lg:col-span-3 gap-6">
          
          <div className="order-1 md:order-none w-full fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="border-b border-zinc-800 pb-4 mb-6">
              <h2 className="text-lg md:text-xl font-mono uppercase tracking-widest text-white mb-2">Play with Complexity</h2>
              <p className="text-xs text-zinc-500 font-mono uppercase tracking-tight">Adjust parameters, observe the transformation</p>
            </div>
            <PatternControls config={config} onChange={handleConfigChange} />
          </div>

          <div className="order-4 md:order-none w-full bg-zinc-900/50 p-6 rounded-sm border border-zinc-800/50 flex flex-col gap-4 fade-in-up" style={{ animationDelay: '0.5s' }}>
            <h3 className="text-xs font-mono uppercase tracking-widest text-white">Flow Control</h3>
            
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
                <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </div>

        <div className="contents md:flex md:flex-col md:col-span-8 lg:col-span-9 gap-6">
          
          {/* 2D Preview */}
          <div className="order-2 md:order-none w-full h-48 bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden relative shadow-inner shrink-0 fade-in-up" style={{ animationDelay: '0.3s' }}>
            <GPU2DPreview config={config} isPaused={isPaused} />
          </div>

          {/* 3D Viewer */}
          <div className="order-3 md:order-none w-full h-[400px] md:h-auto md:flex-grow bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden relative shadow-sm fade-in-up" style={{ animationDelay: '0.4s' }}>
            <ReliefViewer config={config} colors={colors} isPaused={isPaused} />
          </div>

        </div>
      </div>
    </section>
  );
};

export default InteractiveStudio;
