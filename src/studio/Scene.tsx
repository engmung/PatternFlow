import React, {
  useLayoutEffect,
  useRef,
  useMemo,
  useState,
  useCallback,
  useEffect,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
} from "@react-three/drei";
import * as THREE from "three";
import {
  Node,
  Connection,
  NodeType,
  GRID_SIZE,
  GRID_WORLD_SIZE,
  ColorRampStop,
  DEFAULT_COLOR_RAMP_STOPS,
} from "./types";
import { Download, Play, Pause, RotateCcw, X, Eye } from "lucide-react";
import { generateFragmentShader } from "./utils/shaderGenerator";

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

import { GPUHeightmapGenerator } from "../engine/GPUHeightmapGenerator";

interface SceneProps {
  nodes: Node[];
  connections: Connection[];
  colorRampStops: ColorRampStop[];
  setColorRampStops: (stops: ColorRampStop[]) => void;
}

const tempObject = new THREE.Object3D();

import { ReliefGrid } from './ReliefGrid';
import { ColorRampUI } from './ColorRampUI';
import { GridPreview } from './GridPreview';


interface SceneProps {
  nodes: Node[];
  connections: Connection[];
  colorRampStops: ColorRampStop[];
  setColorRampStops: (stops: ColorRampStop[]) => void;
  // Curator Props
  showCurator?: boolean;
  grayscaleMode?: boolean;
  setGrayscaleMode?: (v: boolean) => void;
  setNodes?: (nodes: Node[]) => void;
  speed?: number;
}

export const Scene: React.FC<SceneProps> = ({
  nodes,
  connections,
  colorRampStops,
  setColorRampStops,
  showCurator = false,
  grayscaleMode = false,
  setGrayscaleMode,
  setNodes,
  speed = 1.0,
}) => {
  const exportRef = useRef<() => void>(() => {});
  const [paused, setPaused] = useState(false);

  // Extract speed from the first Time node found
  const timeNode = nodes.find(n => n.type === NodeType.TIME);
  // Use prop speed if provided (for overrides), otherwise use node speed
  const effectiveSpeed = speed !== 1.0 ? speed : (timeNode?.data.speed ?? 1.0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handler for selecting a variation from the grid
  const handleSelectVariation = useCallback((newNodes: Node[]) => {
    if (setNodes) {
        setNodes(newNodes);
    }
  }, [setNodes]);

  return (
    <div className="w-full h-full bg-gray-900 relative">
      <Canvas shadows gl={{ preserveDrawingBuffer: true }}>
        <PerspectiveCamera 
            makeDefault 
            position={showCurator ? [0, 40, 40] : [12, 12, 12]} 
            fov={showCurator ? 60 : 40} 
        />
        <OrbitControls makeDefault autoRotate={!paused && !showCurator} autoRotateSpeed={0.5} dampingFactor={0.05} />

        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 20, 10]} intensity={2.8} castShadow shadow-mapSize={[2048, 2048]} />

        <group position={[0, -2, 0]}>
          {showCurator ? (
             <GridPreview 
                nodes={nodes}
                connections={connections}
                colorRampStops={colorRampStops}
                paused={paused}
                grayscaleMode={grayscaleMode}
                onSelectVariation={handleSelectVariation}
                speed={effectiveSpeed}
             />
          ) : (
             <ReliefGrid
                nodes={nodes}
                connections={connections}
                colorRampStops={colorRampStops}
                setExportFn={(fn) => (exportRef.current = fn)}
                paused={paused}
                grayscaleMode={grayscaleMode}
                speed={effectiveSpeed}
             />
          )}
        </group>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.1, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <shadowMaterial opacity={0.25} />
        </mesh>
      </Canvas>

      <div className="absolute top-4 right-4 flex gap-2">
        <button onClick={() => setGrayscaleMode(!grayscaleMode)}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 shadow-2xl transition-all border text-xs font-bold uppercase tracking-wider ${
            grayscaleMode ? "bg-indigo-600 border-indigo-400 text-white" : "bg-black/60 backdrop-blur-md border-white/10 text-gray-300 hover:text-white"
          }`}
        >
          <Eye size={14} /> {grayscaleMode ? "Normal Mode" : "Texture Mode"}
        </button>
        <button onClick={() => setPaused(!paused)}
          className="px-4 py-2 rounded-xl flex items-center gap-2 shadow-2xl transition-all border bg-black/60 backdrop-blur-md border-white/10 text-gray-300 hover:text-white text-xs font-bold uppercase tracking-wider"
        >
          {paused ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}
          {paused ? "Play" : "Pause"}
        </button>
        <button onClick={() => exportRef.current()}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-2xl transition-all border border-blue-400 text-xs font-bold uppercase tracking-wider"
        >
          <Download size={14} /> Export OBJ
        </button>
      </div>

      <div className="absolute bottom-4 right-4">
        <ColorRampUI stops={colorRampStops} setStops={setColorRampStops} />
      </div>

      {showCurator && (
          <div className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded pointer-events-none">
              <p className="text-xs">Select a variation to make it the master.</p>
          </div>
      )}
    </div>
  );
};
