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

// GPU Heightmap generator - renders to a texture and reads back pixels
class GPUHeightmapGenerator {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private material: THREE.ShaderMaterial;
  private renderTarget: THREE.WebGLRenderTarget;
  private pixelBuffer: Uint8Array;
  public size: number;

  constructor(renderer: THREE.WebGLRenderer, size: number) {
    this.renderer = renderer;
    this.size = size;
    this.pixelBuffer = new Uint8Array(size * size * 4);

    // Orthographic camera looking at XY plane
    this.camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
    this.camera.position.z = 1;

    // Scene with fullscreen quad
    this.scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(1, 1);

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: 'void main() { gl_FragColor = vec4(0.0); }',
      uniforms: {
        uTime: { value: 0 },
        uGridSize: { value: GRID_WORLD_SIZE },
      },
    });

    const mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(mesh);

    // Render target for reading pixels
    this.renderTarget = new THREE.WebGLRenderTarget(size, size, {
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
    });
  }

  updateShader(nodes: Node[], connections: Connection[], precomputedShader?: string) {
    const newFragmentShader = precomputedShader || generateFragmentShader(nodes, connections);
    
    // Only update if changed (simple check)
    if (this.material.fragmentShader !== newFragmentShader) {
      this.material.fragmentShader = newFragmentShader;
      this.material.needsUpdate = true;
    }
  }

  updateUniforms(time: number) {
    this.material.uniforms.uTime.value = time;
  }

  render(): Uint8Array {
    const currentRenderTarget = this.renderer.getRenderTarget();
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.scene, this.camera);
    this.renderer.readRenderTargetPixels(
      this.renderTarget,
      0,
      0,
      this.size,
      this.size,
      this.pixelBuffer
    );
    this.renderer.setRenderTarget(currentRenderTarget);
    return this.pixelBuffer;
  }

  getTexture(): THREE.Texture {
    return this.renderTarget.texture;
  }

  dispose() {
    this.renderTarget.dispose();
    this.material.dispose();
  }
}

interface SceneProps {
  nodes: Node[];
  connections: Connection[];
  colorRampStops: ColorRampStop[];
  setColorRampStops: (stops: ColorRampStop[]) => void;
}

const tempObject = new THREE.Object3D();

interface ReliefGridProps extends SceneProps {
  setExportFn: (fn: () => void) => void;
  paused: boolean;
  grayscaleMode: boolean;
}

const ReliefGrid: React.FC<ReliefGridProps> = ({
  nodes,
  connections,
  setExportFn,
  paused,
  colorRampStops,
  grayscaleMode,
}) => {
  const { gl } = useThree();
  const meshRefs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const timeRef = useRef(0);
  const gpuGeneratorRef = useRef<GPUHeightmapGenerator | null>(null);
  const texturePlaneRef = useRef<THREE.Mesh>(null);

  const outputSettings = useMemo(() => {
    const outputNode = nodes.find((n) => n.type === NodeType.OUTPUT);
    return {
      resolution: outputNode?.data.resolution ?? GRID_SIZE,
      layerHeight: outputNode?.data.layerHeight ?? 0.1,
    };
  }, [nodes]);

  const resolution = outputSettings.resolution;
  const layerHeight = outputSettings.layerHeight;
  const lastResolutionRef = useRef(resolution);

  // Material refs
  const shaderMaterialRef = useRef<THREE.ShaderMaterial>(null);

  useEffect(() => {
    return () => {
      gpuGeneratorRef.current?.dispose();
    };
  }, []);

  const sortedStops = useMemo(
    () => [...colorRampStops].sort((a, b) => a.position - b.position),
    [colorRampStops]
  );

  const colorObjects = useMemo(
    () => sortedStops.map((s) => new THREE.Color(s.color)),
    [sortedStops]
  );

  const boxGeometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const count = resolution * resolution;

  const fragmentShaderCode = useMemo(() => {
    return generateFragmentShader(nodes, connections);
  }, [nodes, connections]);

  // Trigger re-compilation when shader code changes
  useLayoutEffect(() => {
    if (shaderMaterialRef.current) {
        shaderMaterialRef.current.needsUpdate = true;
    }
  }, [fragmentShaderCode]);

  const previewUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uGridSize: { value: GRID_WORLD_SIZE }
  }), []);

  useLayoutEffect(() => {
    setExportFn(() => {
      const gpu = gpuGeneratorRef.current;
      if (!gpu) {
        alert("Render not ready");
        return;
      }

      const pixels = gpu.render();
      const size = resolution;
      const numLayers = sortedStops.length;
      
      let objContent = "# PatternFlow Relief Export\nmtllib model.mtl\n\n";
      let mtlContent = "# PatternFlow Materials\n\n";
      
      sortedStops.forEach((stop, i) => {
        const c = new THREE.Color(stop.color);
        mtlContent += `newmtl Material_${i + 1}\nKd ${c.r.toFixed(4)} ${c.g.toFixed(4)} ${c.b.toFixed(4)}\nd 1.0\nillum 2\n\n`;
      });
      
      const cellSize = GRID_WORLD_SIZE / resolution;
      const offset = GRID_WORLD_SIZE / 2;
      let vertexIndex = 1;
      const layerVertices: string[][] = sortedStops.map(() => []);
      const layerFaces: string[][] = sortedStops.map(() => []);
      
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const idx = (j * size + i) * 4;
            const val = pixels[idx] / 255.0;
            const x = i * cellSize - offset + cellSize / 2;
            const z = j * cellSize - offset + cellSize / 2;
            
            sortedStops.forEach((stop, layerIdx) => {
                if (layerIdx > 0 && val < stop.position) return;

                const y = layerIdx * layerHeight;
                const halfSize = cellSize / 2;
                
                const verts = [
                  [x - halfSize, y, z - halfSize], [x + halfSize, y, z - halfSize],
                  [x + halfSize, y, z + halfSize], [x - halfSize, y, z + halfSize],
                  [x - halfSize, y + layerHeight, z - halfSize], [x + halfSize, y + layerHeight, z - halfSize],
                  [x + halfSize, y + layerHeight, z + halfSize], [x - halfSize, y + layerHeight, z + halfSize],
                ];
                
                verts.forEach(v => layerVertices[layerIdx].push(`v ${v[0]} ${v[1]} ${v[2]}`));
                const base = vertexIndex;
                const faces = [
                    [1,3,2], [1,4,3], [5,6,7], [5,7,8], [1,2,6], [1,6,5],
                    [3,4,8], [3,8,7], [1,5,8], [1,8,4], [2,3,7], [2,7,6]
                ];
                faces.forEach(f => layerFaces[layerIdx].push(`f ${base+f[0]-1} ${base+f[1]-1} ${base+f[2]-1}`));
                vertexIndex += 8;
            });
        }
      }
      
      for (let i = 0; i < numLayers; i++) {
        if (layerVertices[i].length > 0) {
          objContent += `g Layer_${i + 1}\nusemtl Material_${i + 1}\n${layerVertices[i].join("\n")}\n${layerFaces[i].join("\n")}\n\n`;
        }
      }

      const link = document.createElement("a");
      link.download = "model.obj";
      link.href = URL.createObjectURL(new Blob([objContent], {type: 'text/plain'}));
      link.click();
      
      const link2 = document.createElement("a");
      link2.download = "model.mtl";
      link2.href = URL.createObjectURL(new Blob([mtlContent], {type: 'text/plain'}));
      link2.click();
    });
  }, [sortedStops, resolution, layerHeight, nodes, connections]);

  useFrame((_, delta) => {
    if (!paused) timeRef.current += delta;

    if (!gpuGeneratorRef.current || lastResolutionRef.current !== resolution) {
        gpuGeneratorRef.current?.dispose();
        gpuGeneratorRef.current = new GPUHeightmapGenerator(gl, resolution);
        lastResolutionRef.current = resolution;
    }
    
    const gpu = gpuGeneratorRef.current;
    if (!gpu) return;

    // Update shader only if it changed (using memoized code for performance)
    gpu.updateShader(nodes, connections, fragmentShaderCode);
    
    gpu.updateUniforms(timeRef.current);
    const pixels = gpu.render();
    
    // Update preview material if in grayscale mode
    if (grayscaleMode && shaderMaterialRef.current) {
        // Sync uniforms
        shaderMaterialRef.current.uniforms.uTime.value = timeRef.current;
        shaderMaterialRef.current.uniforms.uGridSize.value = GRID_WORLD_SIZE;
        
        // Hide relief meshes
        meshRefs.current.forEach(m => { if(m) m.count = 0; });
        return;
    }

    const cellSize = GRID_WORLD_SIZE / resolution;
    const offset = GRID_WORLD_SIZE / 2;
    
    sortedStops.forEach((stop, layerIdx) => {
      const mesh = meshRefs.current[layerIdx];
      if (!mesh) return;

      let instanceIdx = 0;
      for (let i = 0; i < resolution; i++) {
        for (let j = 0; j < resolution; j++) {
            const idx = (j * resolution + i) * 4;
            const val = pixels[idx] / 255.0;

            if (layerIdx === 0 || val >= stop.position) {
                // Center the instances around world origin (0,0)
                const x = i * cellSize - offset + cellSize / 2;
                const z = j * cellSize - offset + cellSize / 2;
                const y = layerIdx * layerHeight + layerHeight/2;

                tempObject.position.set(x, y, z);
                tempObject.scale.set(cellSize, layerHeight, cellSize); // Seamless cubes (1.0 scale)
                tempObject.updateMatrix();
                mesh.setMatrixAt(instanceIdx++, tempObject.matrix);
            }
        }
      }
      mesh.count = instanceIdx;
      mesh.instanceMatrix.needsUpdate = true;
    });
  });

  return (
    <group>
      {!grayscaleMode && sortedStops.map((_, layerIdx) => (
        <instancedMesh
          key={layerIdx}
          ref={(el) => { meshRefs.current[layerIdx] = el; }}
          args={[boxGeometry, undefined, count]}
          castShadow
          receiveShadow
        >
          <meshLambertMaterial color={colorObjects[layerIdx]} />
        </instancedMesh>
      ))}

      {grayscaleMode && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} ref={texturePlaneRef}>
            <planeGeometry args={[GRID_WORLD_SIZE, GRID_WORLD_SIZE]} />
            <shaderMaterial
              ref={shaderMaterialRef}
              vertexShader={vertexShader}
              fragmentShader={fragmentShaderCode}
              uniforms={previewUniforms}
              side={THREE.DoubleSide}
              transparent
            />
          </mesh>
      )}
    </group>
  );
};

// Color Ramp UI Component
interface ColorRampUIProps {
  stops: ColorRampStop[];
  setStops: (stops: ColorRampStop[]) => void;
}

const ColorRampUI: React.FC<ColorRampUIProps> = ({ stops, setStops }) => {
  const [selectedStopIndex, setSelectedStopIndex] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const gradientRef = useRef<HTMLDivElement>(null);

  const sortedStops = useMemo(() => [...stops].sort((a, b) => a.position - b.position), [stops]);

  const gradientStyle = useMemo(() => {
    const colorStops: string[] = [];
    sortedStops.forEach((stop, i) => {
      const pos = stop.position * 100;
      const nextPos = i < sortedStops.length - 1 ? sortedStops[i + 1].position * 100 : 100;
      colorStops.push(`${stop.color} ${pos}%`, `${stop.color} ${nextPos}%`);
    });
    return `linear-gradient(to right, ${colorStops.join(", ")})`;
  }, [sortedStops]);

  const handleGradientClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      if (stops.length >= 8) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const position = Math.max(0, Math.min(1, x / rect.width));
      if (stops.some((s) => Math.abs(s.position - position) < 0.05)) return;
      
      let color = "#808080";
      const sorted = [...stops].sort((a, b) => a.position - b.position);
      for (let i = 0; i < sorted.length - 1; i++) {
        if (position >= sorted[i].position && position <= sorted[i + 1].position) {
          const t = (position - sorted[i].position) / (sorted[i + 1].position - sorted[i].position);
          const c1 = new THREE.Color(sorted[i].color);
          const c2 = new THREE.Color(sorted[i + 1].color);
          c1.lerp(c2, t);
          color = "#" + c1.getHexString();
          break;
        }
      }
      setStops([...stops, { position, color }]);
    }, [stops, setStops]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
      if (draggingIndex === null || !gradientRef.current) return;
      const rect = gradientRef.current.getBoundingClientRect();
      const position = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const newStops = [...stops];
      newStops[draggingIndex] = { ...newStops[draggingIndex], position };
      setStops(newStops);
    }, [draggingIndex, stops, setStops]);

  useEffect(() => {
    if (draggingIndex !== null) {
      window.addEventListener("mousemove", handleMouseMove);
      const end = () => setDraggingIndex(null);
      window.addEventListener("mouseup", end);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", end);
      };
    }
  }, [draggingIndex, handleMouseMove]);

  return (
    <div className="bg-black/90 backdrop-blur text-white p-4 rounded-lg border border-gray-700 w-72 select-none shadow-2xl">
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-sm tracking-tight">Layer Manager</span>
        <button onClick={() => setStops([...DEFAULT_COLOR_RAMP_STOPS])} className="p-1 hover:bg-white/10 rounded transition-colors" title="Reset Colors">
          <RotateCcw size={14} />
        </button>
      </div>

      <div ref={gradientRef} className="h-6 rounded cursor-pointer relative mb-2 border border-white/10" style={{ background: gradientStyle }} onClick={handleGradientClick}>
        {stops.map((stop, idx) => (
          <div key={idx} className={`absolute top-full w-3 h-3 -translate-x-1/2 cursor-grab ${selectedStopIndex === idx ? "z-10" : ""}`} style={{ left: `${stop.position * 100}%` }}
            onMouseDown={(e) => { e.stopPropagation(); setDraggingIndex(idx); setSelectedStopIndex(idx); }}
            onClick={(e) => { e.stopPropagation(); setSelectedStopIndex(idx); }}
          >
            <div className={`w-0 h-0 border-x-[6px] border-x-transparent border-b-[8px] ${selectedStopIndex === idx ? "border-b-blue-400" : "border-b-white/50"}`} />
          </div>
        ))}
      </div>

      <div className="flex justify-between text-[10px] text-gray-500 mb-3 font-mono">
        <span>0.00</span><span>0.50</span><span>1.00</span>
      </div>

      {selectedStopIndex !== null && stops[selectedStopIndex] && (
        <div className="border border-white/5 rounded p-2 mb-3 bg-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-gray-400">Layer {selectedStopIndex + 1}</span>
            {stops.length > 2 && (
              <button onClick={() => { setStops(stops.filter((_, i) => i !== selectedStopIndex)); setSelectedStopIndex(null); }} className="hover:text-red-400 text-gray-500 transition-colors">
                <X size={12} />
              </button>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <input type="color" value={stops[selectedStopIndex].color} onChange={(e) => {
                const ns = [...stops]; ns[selectedStopIndex].color = e.target.value; setStops(ns);
            }} className="w-8 h-8 rounded-md cursor-pointer bg-transparent" />
            <input type="number" step="0.01" value={stops[selectedStopIndex].position.toFixed(2)} onChange={(e) => {
                const ns = [...stops]; ns[selectedStopIndex].position = parseFloat(e.target.value) || 0; setStops(ns);
            }} className="flex-1 bg-black/50 border border-white/10 rounded px-2 py-1 text-xs font-mono" />
          </div>
        </div>
      )}

      <div className="space-y-1">
        {[...sortedStops].reverse().map((stop, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px] text-gray-400">
            <div className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ backgroundColor: stop.color }} />
            <span>Layer {sortedStops.length - i} (Threshold: {stop.position.toFixed(2)})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const Scene: React.FC<SceneProps> = ({
  nodes,
  connections,
  colorRampStops,
  setColorRampStops,
}) => {
  const exportRef = useRef<() => void>(() => {});
  const [paused, setPaused] = useState(false);
  const [grayscaleMode, setGrayscaleMode] = useState(false);

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

  return (
    <div className="w-full h-full bg-gray-900 relative">
      <Canvas shadows gl={{ preserveDrawingBuffer: true }}>
        <PerspectiveCamera makeDefault position={[12, 12, 12]} fov={40} />
        <OrbitControls makeDefault autoRotate={!paused} autoRotateSpeed={0.5} dampingFactor={0.05} />

        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 20, 10]} intensity={2.8} castShadow shadow-mapSize={[2048, 2048]} />

        <group position={[0, -2, 0]}>
          <ReliefGrid
            nodes={nodes}
            connections={connections}
            colorRampStops={colorRampStops}
            setColorRampStops={setColorRampStops}
            setExportFn={(fn) => (exportRef.current = fn)}
            paused={paused}
            grayscaleMode={grayscaleMode}
          />
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
    </div>
  );
};
