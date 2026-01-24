import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Maximize2, Minimize2, Copy, ClipboardPaste, RotateCcw, Palette, Settings } from 'lucide-react';
import { Node, Connection, ColorRampStop, DEFAULT_COLOR_RAMP_STOPS, NodeType } from './types';
import { DEFAULT_NODES, DEFAULT_CONNECTIONS } from './constants';
import { NodeEditor } from './NodeEditor';
import { Scene } from './Scene';
import SEO from '../components/SEO';
import { CuratedParameter, CuratedPreset } from '../types/Preset';

const STORAGE_KEY_NODES = 'patternflow-studio-nodes';
const STORAGE_KEY_CONNECTIONS = 'patternflow-studio-connections';
const STORAGE_KEY_COLOR_RAMP = 'patternflow-studio-colorramp';

// Preset type for export/import
export interface StudioPreset {
  version: 1;
  nodes: Node[];
  connections: Connection[];
  colorRamp: ColorRampStop[];
}

// Built-in presets
const PRESETS: Record<string, StudioPreset> = {
  'Pattern 1': {
    version: 1,
    nodes: [
      {
        id: "time-1",
        type: NodeType.TIME,
        x: 50,
        y: 150,
        data: { speed: -0.2 },
        inputs: {}
      },
      {
        id: "wave-1",
        type: NodeType.WAVE_TEXTURE,
        x: 250,
        y: 100,
        data: {
          waveType: "RINGS",
          direction: "X",
          profile: "SINE",
          waveScale: 8.8,
          distortion: 0,
          detail: 0,
          detailScale: 0,
          detailRoughness: 0
        },
        inputs: {}
      },
      {
        id: "out-1",
        type: NodeType.OUTPUT,
        x: 500,
        y: 200,
        data: { resolution: 26, layerHeight: 0.1 },
        inputs: {}
      }
    ],
    connections: [
      {
        id: "c-1",
        fromNode: "time-1",
        fromSocket: "value",
        toNode: "wave-1",
        toSocket: "phase"
      },
      {
        id: "c-2",
        fromNode: "wave-1",
        fromSocket: "value",
        toNode: "out-1",
        toSocket: "value"
      }
    ],
    colorRamp: [
      { position: 0, color: "#000000" },
      { position: 0.31, color: "#fe5858" },
      { position: 0.66, color: "#ff9494" },
      { position: 0.91, color: "#ffffff" }
    ]
  },
  'Pattern 2': {
    version: 1,
    nodes: [
      {
        id: "time-1",
        type: NodeType.TIME,
        x: 23,
        y: 114,
        data: { speed: -0.14 },
        inputs: {}
      },
      {
        id: "wave-1",
        type: NodeType.WAVE_TEXTURE,
        x: 250,
        y: 100,
        data: {
          waveType: "BANDS",
          direction: "X",
          profile: "SINE",
          waveScale: 0.22,
          distortion: 0.05,
          detail: 4.12,
          detailScale: 0.95,
          detailRoughness: 0.09
        },
        inputs: {}
      },
      {
        id: "out-1",
        type: NodeType.OUTPUT,
        x: 500,
        y: 200,
        data: { resolution: 26, layerHeight: 0.16 },
        inputs: {}
      }
    ],
    connections: [
      {
        id: "c-1",
        fromNode: "time-1",
        fromSocket: "value",
        toNode: "wave-1",
        toSocket: "phase"
      },
      {
        id: "c-2",
        fromNode: "wave-1",
        fromSocket: "value",
        toNode: "out-1",
        toSocket: "value"
      }
    ],
    colorRamp: [
      { position: 0, color: "#000000" },
      { position: 0.2755905511811024, color: "#274a9b" },
      { position: 0.5826771653543307, color: "#62abcb" },
      { position: 0.84251968503937, color: "#e1fbfe" }
    ]
  },
  'Pattern 3': {
    version: 1,
    nodes: [
      {
        id: "time-1",
        type: NodeType.TIME,
        x: 50,
        y: 150,
        data: { speed: 0.7 },
        inputs: {}
      },
      {
        id: "wave-1",
        type: NodeType.WAVE_TEXTURE,
        x: 250,
        y: 100,
        data: {
          waveType: "RINGS",
          direction: "X",
          profile: "SINE",
          waveScale: 1.01,
          distortion: 0,
          detail: 1.1,
          detailScale: 10,
          detailRoughness: 0
        },
        inputs: {
          vector: "c-1768215848975"
        }
      },
      {
        id: "out-1",
        type: NodeType.OUTPUT,
        x: 500,
        y: 200,
        data: { resolution: 37, layerHeight: 0.1 },
        inputs: {}
      },
      {
        id: "n-1768215800324",
        type: NodeType.POSITION,
        x: -402.6899007093227,
        y: 448.5735245244442,
        data: {},
        inputs: {}
      },
      {
        id: "n-1768215828982",
        type: NodeType.COMBINE_XYZ,
        x: 189.6372221789883,
        y: 473.8647317520862,
        data: { x: 0, y: 0, z: 0 },
        inputs: {
          x: "c-1768215870238",
          y: "c-1768215977086"
        }
      },
      {
        id: "n-1768215830959",
        type: NodeType.SEPARATE_XYZ,
        x: -212.47976535396418,
        y: 445.80973483156475,
        data: {},
        inputs: {
          vector: "c-1768215834334"
        }
      },
      {
        id: "n-1768215863611",
        type: NodeType.MATH,
        x: -28.2994770888347,
        y: 318.652275782979,
        data: {
          op: "MUL",
          value: 7.1
        },
        inputs: {
          a: "c-1768215867421"
        }
      }
    ],
    connections: [
      {
        id: "c-1",
        fromNode: "time-1",
        fromSocket: "value",
        toNode: "wave-1",
        toSocket: "phase"
      },
      {
        id: "c-2",
        fromNode: "wave-1",
        fromSocket: "value",
        toNode: "out-1",
        toSocket: "value"
      },
      {
        id: "c-1768215834334",
        fromNode: "n-1768215800324",
        fromSocket: "vector",
        toNode: "n-1768215830959",
        toSocket: "vector"
      },
      {
        id: "c-1768215848975",
        fromNode: "n-1768215828982",
        fromSocket: "vector",
        toNode: "wave-1",
        toSocket: "vector"
      },
      {
        id: "c-1768215867421",
        fromNode: "n-1768215830959",
        fromSocket: "x",
        toNode: "n-1768215863611",
        toSocket: "a"
      },
      {
        id: "c-1768215870238",
        fromNode: "n-1768215863611",
        fromSocket: "value",
        toNode: "n-1768215828982",
        toSocket: "x"
      },
      {
        id: "c-1768215977086",
        fromNode: "n-1768215830959",
        fromSocket: "y",
        toNode: "n-1768215828982",
        toSocket: "y"
      }
    ],
    colorRamp: [
      { position: 0, color: "#000000" },
      { position: 0.2874015748031496, color: "#40fe0b" },
      { position: 0.66, color: "#a3ff33" },
      { position: 0.91, color: "#ffffff" }
    ]
  }
};

// Load from localStorage or use defaults
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load from localStorage:', e);
  }
  return defaultValue;
}

const StudioPage: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>(() =>
    loadFromStorage(STORAGE_KEY_NODES, DEFAULT_NODES as Node[])
  );
  const [connections, setConnections] = useState<Connection[]>(() =>
    loadFromStorage(STORAGE_KEY_CONNECTIONS, DEFAULT_CONNECTIONS)
  );
  const [colorRamp, setColorRamp] = useState<ColorRampStop[]>(() =>
    loadFromStorage(STORAGE_KEY_COLOR_RAMP, DEFAULT_COLOR_RAMP_STOPS)
  );
  
  const [showCurator, setShowCurator] = useState(false);
  const [grayscaleMode, setGrayscaleMode] = useState(false);

  const [viewerExpanded, setViewerExpanded] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile check
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load preset
  const loadPreset = useCallback((presetName: string) => {
    const preset = PRESETS[presetName];
    if (preset) {
      setNodes(preset.nodes as Node[]);
      setConnections(preset.connections);
      setColorRamp(preset.colorRamp);
      setCopyMessage(`Loaded: ${presetName}`);
      setTimeout(() => setCopyMessage(null), 2000);
      setShowPresets(false);
    }
  }, []);

  // Save to localStorage when nodes/connections/colorRamp change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NODES, JSON.stringify(nodes));
    } catch (e) {
      console.warn('Failed to save nodes:', e);
    }
  }, [nodes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONNECTIONS, JSON.stringify(connections));
    } catch (e) {
      console.warn('Failed to save connections:', e);
    }
  }, [connections]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COLOR_RAMP, JSON.stringify(colorRamp));
    } catch (e) {
      console.warn('Failed to save colorRamp:', e);
    }
  }, [colorRamp]);

  // Export preset to clipboard
  const handleExport = useCallback(async () => {
    const preset: StudioPreset = {
      version: 1,
      nodes,
      connections,
      colorRamp,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(preset, null, 2));
      setCopyMessage('Copied!');
      setTimeout(() => setCopyMessage(null), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
      setCopyMessage('Failed');
      setTimeout(() => setCopyMessage(null), 2000);
    }
  }, [nodes, connections, colorRamp]);

  // Import preset from clipboard
  const handleImport = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const preset = JSON.parse(text) as StudioPreset;

      if (preset.version !== 1 || !preset.nodes || !preset.connections) {
        throw new Error('Invalid preset format');
      }

      setNodes(preset.nodes);
      setConnections(preset.connections);
      if (preset.colorRamp) {
        setColorRamp(preset.colorRamp);
      }
      setCopyMessage('Loaded!');
      setTimeout(() => setCopyMessage(null), 2000);
    } catch (e) {
      console.error('Failed to import:', e);
      setCopyMessage('Invalid');
      setTimeout(() => setCopyMessage(null), 2000);
    }
  }, []);

  // Reset to defaults
  const handleReset = useCallback(() => {
    if (confirm('Reset all nodes and colors to default?')) {
      setNodes(DEFAULT_NODES as Node[]);
      setConnections(DEFAULT_CONNECTIONS);
      setColorRamp(DEFAULT_COLOR_RAMP_STOPS);
      setCopyMessage('Reset!');
      setTimeout(() => setCopyMessage(null), 2000);
    }
  }, []);

  // Export Curated Preset
  const handleExportPreset = useCallback(() => {
    const parameterNodes = nodes.filter(n => n.type === NodeType.PARAMETER);
    if (parameterNodes.length === 0) {
      alert("Please add at least 1 'Curator Param' node for the preset.");
      return;
    }

    const preset: CuratedPreset = {
      id: `p-${Date.now()}`, // simple ID generation
      name: "New Pattern",
      description: "Created with PatternFlow Studio",
      author: "Artist",
      version: 1,
      nodes,
      connections,
      colorRamp,
      parameters: nodes.filter(n => n.type === NodeType.PARAMETER).map(n => {
        const spread = n.data.spread ?? 0.1;
        const current = n.data.value ?? 0;
        return {
            id: `param-${n.id}`, 
            label: n.data.label || 'Param',
            nodeId: n.id,
            property: 'value',
            // Define range as +/- 50 steps
            min: current - (spread * 50),
            max: current + (spread * 50),
            default: current,
            step: spread,
            sensitivity: 1
        };
      }),
      gridResolution: 40, // default
      // TODO: Generate thumbnail?
      createdAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `preset-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, connections, colorRamp]);


  return (
    <div className="w-full h-screen bg-[#1a1a1a] flex flex-col overflow-hidden relative">
      <SEO 
        title="Interactive Studio" 
        description="Create your own generative art with Patternflow Studio. Connect nodes, manipulate noise, and visualize 3D relief patterns in real-time."
      />
      {/* Mobile Warning Overlay */}
      {isMobile && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center p-8 text-center backdrop-blur-2xl bg-black/90">
          <div className="max-w-xs space-y-6">
            <h2 className="font-serif text-3xl tracking-widest text-white">
              PATTERNFLOW
            </h2>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <p className="text-gray-400 text-sm font-light leading-relaxed">
              The PatternFlow Studio is optimized for desktop computers. 
              Please access this page on a PC for the best generative experience.
            </p>
            <Link 
              to="/" 
              className="inline-block px-6 py-2 border border-white/10 text-white text-xs tracking-widest hover:bg-white/5 transition-colors"
            >
              BACK TO HOME
            </Link>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 backdrop-blur-md bg-black/70 border-b border-white/5 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm hidden sm:inline">Back</span>
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <h1 className="font-serif text-xl md:text-2xl tracking-widest text-white font-medium">
             CURATOR <span className="text-gray-500 font-sans text-xs tracking-normal">Mode</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
            <button
                onClick={() => setShowCurator(!showCurator)}
                className={`p-2 transition-colors flex items-center gap-2 text-xs uppercase tracking-wider font-bold px-3 border rounded-lg ${
                  showCurator ? "bg-blue-600 border-blue-500 text-white" : "border-gray-700 text-gray-400 hover:text-white"
                }`}
              >
                <Settings size={14} /> {showCurator ? "Curator Active" : "Curator Mode"}
            </button>
            
            {showCurator && (
                <button
                    onClick={handleExportPreset}
                    className="p-2 bg-green-600 hover:bg-green-500 text-white transition-colors flex items-center gap-2 text-xs uppercase tracking-wider font-bold px-3 border border-green-500 rounded-lg animate-pulse"
                >
                    <Copy size={14} /> Save Preset
                </button>
            )}

            <div className="h-4 w-px bg-gray-700 mx-2" />
            
             {/* Standard buttons */}
             {!showCurator && (
                <>
                  <button
                    onClick={() => setShowPresets(!showPresets)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="Load preset"
                  >
                    <Palette size={18} />
                  </button>
                  {showPresets && (
                    <div className="absolute top-full right-0 mt-2 bg-[#2d2d2d] border border-gray-700 rounded-lg shadow-xl z-50 min-w-[200px]">
                      <div className="p-2 border-b border-gray-700">
                        <span className="text-xs text-gray-400">Presets</span>
                      </div>
                      {Object.keys(PRESETS).map((presetName) => (
                        <button
                          key={presetName}
                          onClick={() => loadPreset(presetName)}
                          className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                        >
                          {presetName}
                        </button>
                      ))}
                    </div>
                  )}
                   <button
                    onClick={handleExport}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="Copy preset to clipboard"
                  >
                    <Copy size={18} />
                  </button>
                  <button
                    onClick={handleImport}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="Paste preset from clipboard"
                  >
                    <ClipboardPaste size={18} />
                  </button>
                  <button
                    onClick={handleReset}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="Reset to default"
                  >
                    <RotateCcw size={18} />
                  </button>
                </>
             )}

             {/* Curator View Toggle */}
             {showCurator && (
                <button
                    onClick={() => setGrayscaleMode(!grayscaleMode)}
                    className={`p-2 transition-colors flex items-center gap-2 text-xs uppercase tracking-wider font-bold px-3 border rounded-lg ${
                      grayscaleMode ? "bg-indigo-600 border-indigo-500 text-white" : "border-gray-700 text-gray-400 hover:text-white"
                    }`}
                  >
                    <Settings size={14} /> {grayscaleMode ? "Normal Mode" : "Texture Mode"}
                  </button>
             )}
            
          <div className="h-4 w-px bg-gray-700" />
          <button
            onClick={() => setViewerExpanded(!viewerExpanded)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title={viewerExpanded ? 'Show Node Editor' : 'Expand Viewer'}
          >
            {viewerExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Node Editor Panel */}
        {!viewerExpanded && (
          <div className="flex-1 h-full border-r border-gray-800 min-w-0 relative">
             <NodeEditor
              nodes={nodes}
              connections={connections}
              setNodes={setNodes}
              setConnections={setConnections}
            />
          </div>
        )}

        {/* 3D Viewer Panel */}
        <div className={viewerExpanded ? 'w-full h-full' : 'w-1/2 h-full'}>
           <Scene
            nodes={nodes}
            connections={connections}
            colorRampStops={colorRamp}
            setColorRampStops={setColorRamp}
            showCurator={showCurator}
            grayscaleMode={grayscaleMode}
            setGrayscaleMode={setGrayscaleMode}
            setNodes={setNodes}
          />
        </div>


      </div>

     {/* Footer */}
      <footer className="px-4 py-2 bg-[#252525] border-t border-gray-800 shrink-0">
        <div className="flex items-center justify-between text-[10px] text-gray-500">
          <span>
             {showCurator ? "DRAG SLIDERS TO SPREAD • CLICK GRID TO SELECT" : "Blender Compatible | Grid: 10×10 | Resolution: 40×40"}
          </span>
          <span>
            {showCurator ? "Exports JSON for Landing Page" : "Connect TIME → MATH → WAVE → OUTPUT for animation"}
          </span>
        </div>
      </footer>
    </div>
  );
};

export default StudioPage;
