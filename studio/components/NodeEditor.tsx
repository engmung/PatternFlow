import React, { useState, useRef } from 'react';
import { Node, Connection, NodeType, NodeData, VectorMathOp } from '../types';
import { NODE_DEFINITIONS } from '../constants';
import { Plus, Trash2 } from 'lucide-react';

interface NodeEditorProps {
  nodes: Node[];
  connections: Connection[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setConnections: React.Dispatch<React.SetStateAction<Connection[]>>;
}

// Vector Math operations that return scalar (not vector)
const SCALAR_OUTPUT_OPS: VectorMathOp[] = ['DOT_PRODUCT', 'LENGTH', 'DISTANCE'];

export const NodeEditor: React.FC<NodeEditorProps> = ({
  nodes,
  connections,
  setNodes,
  setConnections,
}) => {
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [tempConnection, setTempConnection] = useState<{
    fromNode: string;
    fromSocket: string;
    x: number;
    y: number;
  } | null>(null);

  // Navigation State
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);

  // Helper to find socket position in World Coordinates
  const getSocketPos = (nodeId: string, socketName: string, isInput: boolean) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };

    const def = NODE_DEFINITIONS[node.type];
    const index = isInput
      ? def.inputs.indexOf(socketName)
      : def.outputs.indexOf(socketName);

    const yOffset = 40 + index * 24 + 12;

    return {
      x: node.x + (isInput ? 0 : 160),
      y: node.y + yOffset,
    };
  };

  // Convert screen (mouse) coordinates to world coordinates
  const toWorld = (cx: number, cy: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (cx - rect.left - viewport.x) / viewport.zoom,
      y: (cy - rect.top - viewport.y) / viewport.zoom,
    };
  };

  const handleWheel = (e: React.WheelEvent) => {
    const zoomSensitivity = 0.001;
    const newZoom = Math.min(
      Math.max(viewport.zoom - e.deltaY * zoomSensitivity, 0.2),
      3
    );
    setViewport((prev) => ({ ...prev, zoom: newZoom }));
  };

  const handleMouseDown = (
    e: React.MouseEvent,
    nodeId: string | null = null
  ) => {
    e.stopPropagation();

    if (e.button === 1 || (e.button === 0 && nodeId === null)) {
      // Middle click OR Left click on background -> Pan
      if (nodeId === null) {
        setIsPanning(true);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        return;
      }
    }

    if (e.button === 0 && nodeId) {
      // Left click on node -> Drag Node
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        const worldMouse = toWorld(e.clientX, e.clientY);
        setDragOffset({ x: worldMouse.x - node.x, y: worldMouse.y - node.y });
        setDraggingNode(nodeId);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setViewport((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (draggingNode) {
      const worldMouse = toWorld(e.clientX, e.clientY);
      setNodes((prev) =>
        prev.map((n) =>
          n.id === draggingNode
            ? {
                ...n,
                x: worldMouse.x - dragOffset.x,
                y: worldMouse.y - dragOffset.y,
              }
            : n
        )
      );
    }

    if (tempConnection) {
      const worldMouse = toWorld(e.clientX, e.clientY);
      setTempConnection((prev) =>
        prev ? { ...prev, x: worldMouse.x, y: worldMouse.y } : null
      );
    }
  };

  const handleMouseUp = () => {
    setDraggingNode(null);
    setTempConnection(null);
    setIsPanning(false);
  };

  const startConnection = (
    e: React.MouseEvent,
    nodeId: string,
    socketName: string
  ) => {
    e.stopPropagation();
    const worldMouse = toWorld(e.clientX, e.clientY);
    setTempConnection({
      fromNode: nodeId,
      fromSocket: socketName,
      x: worldMouse.x,
      y: worldMouse.y,
    });
  };

  const endConnection = (
    e: React.MouseEvent,
    nodeId: string,
    socketName: string
  ) => {
    e.stopPropagation();
    if (tempConnection) {
      if (tempConnection.fromNode === nodeId) return;
      const newConnId = `c-${Date.now()}`;

      setNodes((prev) =>
        prev.map((n) => {
          if (n.id === nodeId) {
            return {
              ...n,
              inputs: { ...n.inputs, [socketName]: newConnId },
            };
          }
          return n;
        })
      );

      setConnections((prev) => [
        ...prev,
        {
          id: newConnId,
          fromNode: tempConnection.fromNode,
          fromSocket: tempConnection.fromSocket,
          toNode: nodeId,
          toSocket: socketName,
        },
      ]);
      setTempConnection(null);
    }
  };

  const deleteNode = (id: string) => {
    if (id === 'out-1') return;
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setConnections((prev) =>
      prev.filter((c) => c.fromNode !== id && c.toNode !== id)
    );
  };

  const disconnect = (connId: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== connId));
    setNodes((prev) =>
      prev.map((n) => {
        const newInputs = { ...n.inputs };
        Object.keys(newInputs).forEach((key) => {
          if (newInputs[key] === connId) newInputs[key] = null;
        });
        return { ...n, inputs: newInputs };
      })
    );
  };

  const addNode = (type: NodeType) => {
    const id = `n-${Date.now()}`;
    const def = NODE_DEFINITIONS[type];
    const cx =
      (viewport.x * -1 + (canvasRef.current?.clientWidth || 800) / 2) /
      viewport.zoom;
    const cy =
      (viewport.y * -1 + (canvasRef.current?.clientHeight || 600) / 2) /
      viewport.zoom;

    setNodes((prev) => [
      ...prev,
      {
        id,
        type,
        x: cx - 80 + Math.random() * 40,
        y: cy - 40 + Math.random() * 40,
        data: def.initialData ? { ...def.initialData } : {},
        inputs: {},
      },
    ]);
  };

  const updateNodeData = (id: string, key: keyof NodeData, value: unknown) => {
    setNodes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, [key]: value } } : n
      )
    );
  };

  // Get node color based on type
  const getNodeColor = (type: NodeType) => {
    switch (type) {
      case NodeType.TIME:
        return 'border-purple-600';
      case NodeType.VALUE:
        return 'border-gray-600';
      case NodeType.VECTOR:
        return 'border-blue-600';
      case NodeType.POSITION:
        return 'border-pink-600';
      case NodeType.MATH:
        return 'border-green-600';
      case NodeType.VECTOR_MATH:
        return 'border-cyan-600';
      case NodeType.WAVE_TEXTURE:
        return 'border-orange-600';
      case NodeType.NOISE_TEXTURE:
        return 'border-yellow-600';
      case NodeType.OUTPUT:
        return 'border-red-600';
      default:
        return 'border-gray-700';
    }
  };

  return (
    <div
      className="relative w-full h-full bg-[#1e1e1e] overflow-hidden select-none font-sans text-xs"
      onMouseMove={handleMouseMove}
      onMouseDown={(e) => handleMouseDown(e, null)}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      ref={canvasRef}
    >
      {/* Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.1,
          backgroundPosition: `${viewport.x}px ${viewport.y}px`,
          backgroundSize: `${20 * viewport.zoom}px ${20 * viewport.zoom}px`,
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
        }}
      />

      {/* Toolbar */}
      <div
        className="absolute top-4 left-4 flex flex-wrap gap-2 z-10"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {Object.values(NODE_DEFINITIONS)
          .filter((d) => d.type !== NodeType.OUTPUT)
          .map((def) => (
            <button
              key={def.type}
              onClick={() => addNode(def.type)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded shadow-lg border border-gray-600 flex items-center gap-1 transition-colors text-xs"
            >
              <Plus size={14} /> {def.label}
            </button>
          ))}
      </div>

      {/* World Container */}
      <div
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
          width: '100%',
          height: '100%',
        }}
      >
        <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
          {connections.map((conn) => {
            const start = getSocketPos(conn.fromNode, conn.fromSocket, false);
            const end = getSocketPos(conn.toNode, conn.toSocket, true);
            const dx = Math.abs(end.x - start.x) * 0.5;
            return (
              <g key={conn.id}>
                <path
                  d={`M ${start.x} ${start.y} C ${start.x + dx} ${start.y}, ${end.x - dx} ${end.y}, ${end.x} ${end.y}`}
                  stroke="#555"
                  strokeWidth="2"
                  fill="none"
                />
                <circle
                  cx={(start.x + end.x) / 2}
                  cy={(start.y + end.y) / 2}
                  r="4"
                  fill="#777"
                  className="pointer-events-auto cursor-pointer hover:fill-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    disconnect(conn.id);
                  }}
                />
              </g>
            );
          })}
          {tempConnection && (
            <path
              d={`M ${getSocketPos(tempConnection.fromNode, tempConnection.fromSocket, false).x} ${getSocketPos(tempConnection.fromNode, tempConnection.fromSocket, false).y} L ${tempConnection.x} ${tempConnection.y}`}
              stroke="#fff"
              strokeWidth="2"
              strokeDasharray="4"
              fill="none"
            />
          )}
        </svg>

        {nodes.map((node) => {
          const def = NODE_DEFINITIONS[node.type];
          return (
            <div
              key={node.id}
              className={`absolute w-40 bg-[#2d2d2d] rounded-lg shadow-xl border-2 ${getNodeColor(node.type)} flex flex-col`}
              style={{ left: node.x, top: node.y }}
            >
              {/* Header */}
              <div
                className="bg-gray-800 p-2 rounded-t-lg flex justify-between items-center cursor-move"
                onMouseDown={(e) => handleMouseDown(e, node.id)}
              >
                <span className="font-bold text-gray-300">{def.label}</span>
                {node.type !== NodeType.OUTPUT && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNode(node.id);
                    }}
                    className="text-gray-500 hover:text-red-400"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>

              {/* Body */}
              <div
                className="p-2 space-y-2"
                onMouseDown={(e) => e.stopPropagation()}
              >
                {/* Inputs */}
                {def.inputs.map((input) => (
                  <div key={input} className="flex items-center h-6 relative">
                    <div
                      className="w-3 h-3 rounded-full bg-blue-500 hover:bg-blue-400 -ml-3.5 border-2 border-[#1e1e1e] cursor-pointer"
                      onMouseUp={(e) => endConnection(e, node.id, input)}
                      title={input}
                    />
                    <span className="ml-1 text-gray-400 capitalize">
                      {input}
                    </span>
                  </div>
                ))}

                {/* Controls */}
                {node.type === NodeType.TIME && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-500">Speed</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full bg-gray-900 border border-gray-700 rounded px-1 text-gray-300"
                      value={node.data.speed ?? 1}
                      onChange={(e) =>
                        updateNodeData(
                          node.id,
                          'speed',
                          parseFloat(e.target.value)
                        )
                      }
                    />
                  </div>
                )}

                {node.type === NodeType.VALUE && (
                  <input
                    type="number"
                    step="0.1"
                    className="w-full bg-gray-900 border border-gray-700 rounded px-1 text-gray-300"
                    value={node.data.value ?? 0}
                    onChange={(e) =>
                      updateNodeData(
                        node.id,
                        'value',
                        parseFloat(e.target.value)
                      )
                    }
                  />
                )}

                {node.type === NodeType.VECTOR && (
                  <div className="space-y-1">
                    {(['x', 'y', 'z'] as const).map((axis) => (
                      <div key={axis} className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-500 uppercase">{axis}</span>
                        <input
                          type="number"
                          step="0.1"
                          className="w-16 bg-gray-900 border border-gray-700 rounded px-1 text-gray-300 text-right text-[10px]"
                          value={node.data[axis] ?? 0}
                          onChange={(e) =>
                            updateNodeData(
                              node.id,
                              axis,
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}

                {node.type === NodeType.MATH && (
                  <>
                    <select
                      className="w-full bg-gray-900 border border-gray-700 rounded px-1 py-1 text-gray-300"
                      value={node.data.op ?? 'ADD'}
                      onChange={(e) =>
                        updateNodeData(node.id, 'op', e.target.value)
                      }
                    >
                      {['ADD', 'SUB', 'MUL', 'DIV', 'MIN', 'MAX', 'SIN', 'COS'].map(
                        (op) => (
                          <option key={op} value={op}>
                            {op}
                          </option>
                        )
                      )}
                    </select>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-gray-500">B Value</label>
                      <input
                        type="number"
                        step="0.1"
                        className="w-full bg-gray-900 border border-gray-700 rounded px-1 text-gray-300"
                        value={node.data.value ?? 0}
                        onChange={(e) =>
                          updateNodeData(
                            node.id,
                            'value',
                            parseFloat(e.target.value)
                          )
                        }
                      />
                    </div>
                  </>
                )}

                {node.type === NodeType.VECTOR_MATH && (
                  <>
                    <select
                      className="w-full bg-gray-900 border border-gray-700 rounded px-1 py-1 text-gray-300 text-[10px]"
                      value={node.data.vectorOp ?? 'ADD'}
                      onChange={(e) =>
                        updateNodeData(node.id, 'vectorOp', e.target.value as VectorMathOp)
                      }
                    >
                      <optgroup label="Basic">
                        <option value="ADD">Add</option>
                        <option value="SUBTRACT">Subtract</option>
                        <option value="MULTIPLY">Multiply</option>
                        <option value="DIVIDE">Divide</option>
                        <option value="SCALE">Scale</option>
                      </optgroup>
                      <optgroup label="Vector">
                        <option value="CROSS_PRODUCT">Cross Product</option>
                        <option value="DOT_PRODUCT">Dot Product</option>
                        <option value="NORMALIZE">Normalize</option>
                        <option value="LENGTH">Length</option>
                        <option value="DISTANCE">Distance</option>
                      </optgroup>
                      <optgroup label="Math">
                        <option value="FLOOR">Floor</option>
                        <option value="CEIL">Ceil</option>
                        <option value="FRACTION">Fraction</option>
                        <option value="ABSOLUTE">Absolute</option>
                        <option value="MINIMUM">Minimum</option>
                        <option value="MAXIMUM">Maximum</option>
                      </optgroup>
                      <optgroup label="Trigonometry">
                        <option value="SINE">Sine</option>
                        <option value="COSINE">Cosine</option>
                        <option value="TANGENT">Tangent</option>
                      </optgroup>
                    </select>
                    {node.data.vectorOp === 'SCALE' && (
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-500">Scale</span>
                        <input
                          type="number"
                          step="0.1"
                          className="w-16 bg-gray-900 border border-gray-700 rounded px-1 text-gray-300 text-right text-[10px]"
                          value={node.data.scale ?? 1}
                          onChange={(e) =>
                            updateNodeData(
                              node.id,
                              'scale',
                              parseFloat(e.target.value) || 1
                            )
                          }
                        />
                      </div>
                    )}
                    {SCALAR_OUTPUT_OPS.includes(node.data.vectorOp as VectorMathOp) && (
                      <div className="text-[9px] text-yellow-500 mt-1">
                        Returns scalar value
                      </div>
                    )}
                  </>
                )}

                {node.type === NodeType.NOISE_TEXTURE && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-500">Scale</label>
                    <input
                      type="number"
                      step="0.5"
                      className="w-full bg-gray-900 border border-gray-700 rounded px-1 text-gray-300"
                      value={node.data.noiseScale ?? 5}
                      onChange={(e) =>
                        updateNodeData(
                          node.id,
                          'noiseScale',
                          parseFloat(e.target.value)
                        )
                      }
                    />
                  </div>
                )}

                {node.type === NodeType.WAVE_TEXTURE && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      <select
                        className="flex-1 bg-gray-900 border border-gray-700 rounded px-1 py-1 text-gray-300 text-[10px]"
                        value={node.data.waveType ?? 'BANDS'}
                        onChange={(e) =>
                          updateNodeData(node.id, 'waveType', e.target.value)
                        }
                      >
                        <option value="BANDS">Bands</option>
                        <option value="RINGS">Rings</option>
                      </select>
                      <select
                        className="flex-1 bg-gray-900 border border-gray-700 rounded px-1 py-1 text-gray-300 text-[10px]"
                        value={node.data.profile ?? 'SINE'}
                        onChange={(e) =>
                          updateNodeData(node.id, 'profile', e.target.value)
                        }
                      >
                        <option value="SINE">Sine</option>
                        <option value="SAW">Saw</option>
                      </select>
                    </div>
                    {node.data.waveType === 'BANDS' && (
                      <select
                        className="w-full bg-gray-900 border border-gray-700 rounded px-1 py-1 text-gray-300 text-[10px]"
                        value={node.data.direction ?? 'X'}
                        onChange={(e) =>
                          updateNodeData(node.id, 'direction', e.target.value)
                        }
                      >
                        <option value="X">X</option>
                        <option value="Y">Y</option>
                        <option value="Z">Z</option>
                        <option value="DIAGONAL">Diagonal</option>
                      </select>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[10px] text-gray-500">Scale</span>
                      <input
                        type="number"
                        step="0.1"
                        className="w-14 bg-gray-900 border border-gray-700 rounded px-1 text-gray-300 text-right text-[10px]"
                        value={node.data.waveScale ?? 0.91}
                        onChange={(e) =>
                          updateNodeData(
                            node.id,
                            'waveScale',
                            parseFloat(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-gray-500">Distort</span>
                      <input
                        type="number"
                        step="0.1"
                        className="w-14 bg-gray-900 border border-gray-700 rounded px-1 text-gray-300 text-right text-[10px]"
                        value={node.data.distortion ?? 1.1}
                        onChange={(e) =>
                          updateNodeData(
                            node.id,
                            'distortion',
                            parseFloat(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-gray-500">Detail</span>
                      <input
                        type="number"
                        step="0.1"
                        className="w-14 bg-gray-900 border border-gray-700 rounded px-1 text-gray-300 text-right text-[10px]"
                        value={node.data.detail ?? 1.8}
                        onChange={(e) =>
                          updateNodeData(
                            node.id,
                            'detail',
                            parseFloat(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-gray-500">D.Scale</span>
                      <input
                        type="number"
                        step="0.5"
                        className="w-14 bg-gray-900 border border-gray-700 rounded px-1 text-gray-300 text-right text-[10px]"
                        value={node.data.detailScale ?? 28.9}
                        onChange={(e) =>
                          updateNodeData(
                            node.id,
                            'detailScale',
                            parseFloat(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-gray-500">Rough</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        className="w-14 bg-gray-900 border border-gray-700 rounded px-1 text-gray-300 text-right text-[10px]"
                        value={node.data.detailRoughness ?? 0.5}
                        onChange={(e) =>
                          updateNodeData(
                            node.id,
                            'detailRoughness',
                            parseFloat(e.target.value)
                          )
                        }
                      />
                    </div>
                  </div>
                )}

                {/* Outputs */}
                {def.outputs.map((output) => (
                  <div
                    key={output}
                    className="flex items-center justify-end h-6 relative"
                  >
                    <span className="mr-1 text-gray-400 capitalize">
                      {output}
                    </span>
                    <div
                      className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 -mr-3.5 border-2 border-[#1e1e1e] cursor-pointer"
                      onMouseDown={(e) => startConnection(e, node.id, output)}
                      title={output}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Hint */}
      <div className="absolute bottom-2 left-2 text-[10px] text-gray-500 pointer-events-none bg-black/50 p-1 rounded">
        Drag to Pan | Wheel to Zoom | Drag Nodes to Move
      </div>
    </div>
  );
};
