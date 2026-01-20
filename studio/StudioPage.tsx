import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, ClipboardPaste, RotateCcw } from 'lucide-react';
import { Node, Connection, ColorRampStop, DEFAULT_COLOR_RAMP_STOPS, NodeType } from './types';
import { DEFAULT_NODES, DEFAULT_CONNECTIONS } from './constants';
import { NodeEditor } from './components/NodeEditor';
import { Scene } from './components/Scene';

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
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
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

  return (
    <div className="w-full h-screen bg-[#1a1a1a] flex flex-col overflow-hidden relative">
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
            PATTERNFLOW <span className="text-gray-500 font-sans text-xs tracking-normal">Studio</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {copyMessage && (
            <span className="text-xs text-green-400 bg-green-900/50 px-2 py-1 rounded">
              {copyMessage}
            </span>
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
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Node Editor Panel */}
        <div className="w-1/2 h-full border-r border-gray-800">
          <NodeEditor
            nodes={nodes}
            connections={connections}
            setNodes={setNodes}
            setConnections={setConnections}
          />
        </div>

        {/* 3D Viewer Panel */}
        <div className="w-1/2 h-full">
          <Scene
            nodes={nodes}
            connections={connections}
            colorRampStops={colorRamp}
            setColorRampStops={setColorRamp}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="px-4 py-2 bg-[#252525] border-t border-gray-800 shrink-0">
        <div className="flex items-center justify-between text-[10px] text-gray-500">
          <span>
            Blender Compatible | Grid: 10×10 | Resolution: 40×40
          </span>
          <span>
            Connect TIME → MATH → WAVE → OUTPUT for animation
          </span>
        </div>
      </footer>
    </div>
  );
};

export default StudioPage;
