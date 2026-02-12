import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  OrbitControls,
  PerspectiveCamera,
} from "@react-three/drei";
import {
  Node,
  Connection,
  NodeType,
  ColorRampStop,
} from "./types";
import { Download, Play, Pause, Eye } from "lucide-react";

import { ReliefGrid } from './ReliefGrid';
import { ReliefCube } from './ReliefCube';
import { ColorRampUI } from './ColorRampUI';
import { GridPreview } from './GridPreview';

// Shared clock + instant camera set on mode change
function SharedClock({ cubeMode, showCurator, paused, speed, sharedTimeRef }: {
  cubeMode: boolean;
  showCurator: boolean;
  paused: boolean;
  speed: number;
  sharedTimeRef: React.MutableRefObject<number>;
}) {
  const { camera } = useThree();
  const isFirstRender = useRef(true);

  // Set camera position instantly on mode change (not on first render — PerspectiveCamera handles that)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const cam = camera as THREE.PerspectiveCamera;
    if (cubeMode) {
      cam.position.set(0, 10, 25);
      cam.fov = 50;
    } else if (showCurator) {
      cam.position.set(0, 40, 40);
      cam.fov = 60;
    } else {
      cam.position.set(12, 12, 12);
      cam.fov = 40;
    }
    cam.updateProjectionMatrix();
  }, [cubeMode, showCurator, camera]);

  // Only accumulate shared time — no camera manipulation per frame
  useFrame((_, delta) => {
    if (!paused) sharedTimeRef.current += delta * speed;
  });

  return null;
}


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
  cubeMode?: boolean;
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
  cubeMode = false,
}) => {
  const exportRef = useRef<() => void>(() => {});
  const sharedTimeRef = useRef(0);
  const [paused, setPaused] = useState(false);
  const [timeOffset, setTimeOffset] = useState(0);
  const [sensitivity, setSensitivity] = useState(0.1); // Default sensitivity

  // Extract speed from the first Time node found
  const timeNode = nodes.find(n => n.type === NodeType.TIME);
  // Use prop speed if provided (for overrides), otherwise use node speed
  const effectiveSpeed = speed !== 1.0 ? speed : (timeNode?.data.speed ?? 1.0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target !== document.body) return;
      
      switch (e.code) {
        case "Space":
          e.preventDefault();
          setPaused((p) => !p);
          break;
        case "ArrowLeft":
          e.preventDefault();
          setTimeOffset(t => t - sensitivity);
          break;
        case "ArrowRight":
          e.preventDefault();
          setTimeOffset(t => t + sensitivity);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSensitivity(s => Math.min(s * 2, 10)); // Max sensitivity 10
          break;
        case "ArrowDown":
          e.preventDefault();
          setSensitivity(s => Math.max(s / 2, 0.01)); // Min sensitivity 0.01
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sensitivity]);

  // Handler for selecting a variation from the grid
  const handleSelectVariation = useCallback((newNodes: Node[]) => {
    if (setNodes) {
        setNodes(newNodes);
    }
  }, [setNodes]);

  return (
    <div className="w-full h-full bg-gray-900 relative">
      <Canvas shadows gl={{ preserveDrawingBuffer: true }}>
        <PerspectiveCamera makeDefault position={[12, 12, 12]} fov={40} />
        <SharedClock cubeMode={cubeMode} showCurator={showCurator} paused={paused} speed={effectiveSpeed} sharedTimeRef={sharedTimeRef} />
        <OrbitControls makeDefault autoRotate={!paused && !showCurator && !cubeMode} autoRotateSpeed={0.5} dampingFactor={0.05} />

        <ambientLight intensity={cubeMode ? 1.2 : 0.6} />
        <directionalLight position={[10, 20, 10]} intensity={2.8} castShadow shadow-mapSize={[2048, 2048]} />
        {cubeMode && <directionalLight position={[0, 15, 20]} intensity={1.5} />}

        <group position={[0, cubeMode ? 0 : -2, 0]}>
          {cubeMode ? (
             <ReliefCube
                nodes={nodes}
                connections={connections}
                colorRampStops={colorRampStops}
                paused={paused}
                cubeSize={5}
                speed={effectiveSpeed}
                timeOffset={timeOffset}
                sharedTimeRef={sharedTimeRef}
             />
          ) : showCurator ? (
             <GridPreview 
                nodes={nodes}
                connections={connections}
                colorRampStops={colorRampStops}
                paused={paused}
                grayscaleMode={grayscaleMode}
                onSelectVariation={handleSelectVariation}
                speed={effectiveSpeed}
                setExportFn={(fn) => (exportRef.current = fn)}
                timeOffset={timeOffset}
                sharedTimeRef={sharedTimeRef}
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
                timeOffset={timeOffset}
                sharedTimeRef={sharedTimeRef}
             />
          )}
        </group>

        {!cubeMode && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.1, 0]} receiveShadow>
            <planeGeometry args={[100, 100]} />
            <shadowMaterial opacity={0.25} />
          </mesh>
        )}
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

      {/* Time Offset Control Indicator */}
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white p-3 rounded-xl border border-white/10 text-xs">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-gray-400">
            <span>←→</span>
            <span>Offset: <span className="text-white font-mono">{timeOffset.toFixed(2)}</span></span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <span>↑↓</span>
            <span>Step: <span className="text-white font-mono">{sensitivity.toFixed(2)}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};
