import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';
import { Node, Connection } from './types';
import { DEFAULT_NODES, DEFAULT_CONNECTIONS } from './constants';
import { NodeEditor } from './components/NodeEditor';
import { Scene } from './components/Scene';

const StudioPage: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>(DEFAULT_NODES as Node[]);
  const [connections, setConnections] = useState<Connection[]>(DEFAULT_CONNECTIONS);
  const [viewerExpanded, setViewerExpanded] = useState(false);

  return (
    <div className="w-full h-screen bg-[#1a1a1a] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#252525] border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm hidden sm:inline">Back</span>
          </Link>
          <div className="h-4 w-px bg-gray-700" />
          <h1 className="font-serif text-lg tracking-wider text-white">
            PATTERNFLOW <span className="text-gray-500 font-sans text-sm">Studio</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
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
          <div className="w-1/2 h-full border-r border-gray-800">
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
          <Scene nodes={nodes} connections={connections} />
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
