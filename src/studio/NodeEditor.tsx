import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Node, Connection, NodeType, NodeData, VectorMathOp } from './types';
import { NODE_DEFINITIONS } from './constants';
import { Plus, Trash2 } from 'lucide-react';


// Draggable number input component (Blender style)
interface DragNumberProps {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  precision?: number;
  className?: string;
}

const DragNumber: React.FC<DragNumberProps> = ({
  value,
  onChange,
  step = 0.1,
  min,
  max,
  precision = 2,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const startX = useRef(0);
  const startValue = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setIsDragging(true);
    startX.current = e.clientX;
    startValue.current = value;
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX.current;
      const sensitivity = e.shiftKey ? 0.1 : 1; // Shift for fine control
      let newValue = startValue.current + delta * step * sensitivity;

      if (min !== undefined) newValue = Math.max(min, newValue);
      if (max !== undefined) newValue = Math.min(max, newValue);

      onChange(Number(newValue.toFixed(precision)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, step, min, max, precision, onChange]);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditValue(value.toString());
  };

  const handleBlur = () => {
    setIsEditing(false);
    let newValue = parseFloat(editValue);
    if (isNaN(newValue)) newValue = value;
    if (min !== undefined) newValue = Math.max(min, newValue);
    if (max !== undefined) newValue = Math.min(max, newValue);
    onChange(Number(newValue.toFixed(precision)));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        type="number"
        className={`bg-gray-900 border border-blue-500 rounded px-1 text-gray-300 text-right text-[10px] outline-none ${className}`}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
      />
    );
  }

  return (
    <div
      className={`bg-gray-900 border border-gray-700 rounded px-1 text-gray-300 text-right text-[10px] cursor-ew-resize select-none hover:border-gray-500 ${isDragging ? 'border-blue-500' : ''} ${className}`}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {value.toFixed(precision)}
    </div>
  );
};

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
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
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
  const socketRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [, forceUpdate] = useState(0);

  // Register socket DOM element
  const registerSocket = useCallback((key: string, el: HTMLDivElement | null) => {
    if (el) {
      socketRefs.current.set(key, el);
    } else {
      socketRefs.current.delete(key);
    }
  }, []);

  // Force re-render when nodes change to update connection lines
  useEffect(() => {
    // Small delay to allow DOM to update
    const timer = setTimeout(() => forceUpdate(n => n + 1), 10);
    return () => clearTimeout(timer);
  }, [nodes]);

  // Delete key to remove selected node
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedNode && selectedNode !== 'out-1') {
        deleteNode(selectedNode);
        setSelectedNode(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode]);

  // Helper to find socket position in World Coordinates (DOM-based)
  const getSocketPos = (nodeId: string, socketName: string, isInput: boolean) => {
    const key = `${nodeId}-${isInput ? 'in' : 'out'}-${socketName}`;
    const socketEl = socketRefs.current.get(key);

    if (socketEl && canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const socketRect = socketEl.getBoundingClientRect();

      // Calculate position relative to canvas, accounting for viewport transform
      const x = (socketRect.left + socketRect.width / 2 - canvasRect.left - viewport.x) / viewport.zoom;
      const y = (socketRect.top + socketRect.height / 2 - canvasRect.top - viewport.y) / viewport.zoom;

      return { x, y };
    }

    // Fallback to node position if socket not found
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };

    return {
      x: node.x + (isInput ? 0 : 160),
      y: node.y + 50,
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
        setSelectedNode(null); // Deselect on background click
        setIsPanning(true);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        return;
      }
    }

    if (e.button === 0 && nodeId) {
      // Left click on node -> Select and Drag Node
      setSelectedNode(nodeId);
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
      case NodeType.COMBINE_XYZ:
        return 'border-indigo-600';
      case NodeType.SEPARATE_XYZ:
        return 'border-violet-600';
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
          const isSelected = selectedNode === node.id;
          return (
            <div
              key={node.id}
              className={`absolute w-40 bg-[#2d2d2d] rounded-lg shadow-xl border-2 ${getNodeColor(node.type)} flex flex-col ${isSelected ? 'ring-2 ring-white ring-opacity-50' : ''}`}
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
                      ref={(el) => registerSocket(`${node.id}-in-${input}`, el)}
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
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-500">Speed</span>
                    <DragNumber
                      value={node.data.speed ?? 1}
                      onChange={(v) => updateNodeData(node.id, 'speed', v)}
                      step={0.1}
                      className="w-14"
                    />
                  </div>
                )}

                {node.type === NodeType.VALUE && (
                  <DragNumber
                    value={node.data.value ?? 0}
                    onChange={(v) => updateNodeData(node.id, 'value', v)}
                    step={0.1}
                    className="w-full"
                  />
                )}

                {node.type === NodeType.VECTOR && (
                  <div className="space-y-1">
                    {(['x', 'y', 'z'] as const).map((axis) => (
                      <div key={axis} className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-500 uppercase">{axis}</span>
                        <DragNumber
                          value={node.data[axis] ?? 0}
                          onChange={(v) => updateNodeData(node.id, axis, v)}
                          step={0.1}
                          className="w-14"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {node.type === NodeType.COMBINE_XYZ && (
                  <div className="space-y-1">
                    {(['x', 'y', 'z'] as const).map((axis) => (
                      <div key={axis} className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-500 uppercase">{axis}</span>
                        <DragNumber
                          value={node.data[axis] ?? 0}
                          onChange={(v) => updateNodeData(node.id, axis, v)}
                          step={0.1}
                          className="w-14"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {node.type === NodeType.MATH && (
                  <>
                    <select
                      className="w-full bg-gray-900 border border-gray-700 rounded px-1 py-1 text-[10px] text-gray-300"
                      value={node.data.op ?? 'ADD'}
                      onChange={(e) =>
                        updateNodeData(node.id, 'op', e.target.value)
                      }
                    >
                      <optgroup label="Functions">
                        <option value="ADD">Add</option>
                        <option value="SUB">Subtract</option>
                        <option value="MUL">Multiply</option>
                        <option value="DIV">Divide</option>
                        <option value="MULTIPLY_ADD">Multiply Add</option>
                        <option value="POWER">Power</option>
                        <option value="LOG">Logarithm</option>
                        <option value="SQRT">Square Root</option>
                        <option value="INVERSE_SQRT">Inverse Sqrt</option>
                        <option value="ABSOLUTE">Absolute</option>
                        <option value="EXPONENT">Exponent</option>
                      </optgroup>
                      <optgroup label="Comparison">
                        <option value="MIN">Minimum</option>
                        <option value="MAX">Maximum</option>
                        <option value="LESS_THAN">Less Than</option>
                        <option value="GREATER_THAN">Greater Than</option>
                        <option value="SIGN">Sign</option>
                        <option value="COMPARE">Compare</option>
                        <option value="SMOOTH_MIN">Smooth Min</option>
                        <option value="SMOOTH_MAX">Smooth Max</option>
                      </optgroup>
                      <optgroup label="Rounding">
                        <option value="ROUND">Round</option>
                        <option value="FLOOR">Floor</option>
                        <option value="CEIL">Ceil</option>
                        <option value="TRUNC">Truncate</option>
                        <option value="FRACT">Fraction</option>
                        <option value="MODULO">Truncated Modulo</option>
                        <option value="FLOORED_MODULO">Floored Modulo</option>
                        <option value="WRAP">Wrap</option>
                        <option value="SNAP">Snap</option>
                        <option value="PINGPONG">Ping-pong</option>
                      </optgroup>
                      <optgroup label="Trigonometric">
                        <option value="SIN">Sine</option>
                        <option value="COS">Cosine</option>
                        <option value="TAN">Tangent</option>
                        <option value="ASIN">Arcsine</option>
                        <option value="ACOS">Arccosine</option>
                        <option value="ATAN">Arctangent</option>
                        <option value="ATAN2">Arctan2</option>
                        <option value="SINH">Hyperbolic Sine</option>
                        <option value="COSH">Hyperbolic Cosine</option>
                        <option value="TANH">Hyperbolic Tangent</option>
                      </optgroup>
                      <optgroup label="Conversion">
                        <option value="RADIANS">To Radians</option>
                        <option value="DEGREES">To Degrees</option>
                      </optgroup>
                    </select>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-500">B Value</span>
                      <DragNumber
                        value={node.data.value ?? 0}
                        onChange={(v) => updateNodeData(node.id, 'value', v)}
                        step={0.1}
                        className="w-14"
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
                        <option value="MULTIPLY_ADD">Multiply Add</option>
                        <option value="SCALE">Scale</option>
                      </optgroup>
                      <optgroup label="Vector">
                        <option value="CROSS_PRODUCT">Cross Product</option>
                        <option value="PROJECT">Project</option>
                        <option value="REFLECT">Reflect</option>
                        <option value="REFRACT">Refract</option>
                        <option value="FACEFORWARD">Faceforward</option>
                        <option value="DOT_PRODUCT">Dot Product</option>
                        <option value="DISTANCE">Distance</option>
                        <option value="LENGTH">Length</option>
                        <option value="NORMALIZE">Normalize</option>
                      </optgroup>
                      <optgroup label="Math">
                        <option value="ABSOLUTE">Absolute</option>
                        <option value="POWER">Power</option>
                        <option value="SIGN">Sign</option>
                        <option value="MINIMUM">Minimum</option>
                        <option value="MAXIMUM">Maximum</option>
                        <option value="FLOOR">Floor</option>
                        <option value="CEIL">Ceil</option>
                        <option value="FRACTION">Fraction</option>
                        <option value="MODULO">Modulo</option>
                        <option value="WRAP">Wrap</option>
                        <option value="SNAP">Snap</option>
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
                        <DragNumber
                          value={node.data.scale ?? 1}
                          onChange={(v) => updateNodeData(node.id, 'scale', v)}
                          step={0.1}
                          className="w-14"
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
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-500">Scale</span>
                    <DragNumber
                      value={node.data.noiseScale ?? 5}
                      onChange={(v) => updateNodeData(node.id, 'noiseScale', v)}
                      step={0.5}
                      min={0.1}
                      className="w-14"
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
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-500">Scale</span>
                      <DragNumber
                        value={node.data.waveScale ?? 0.5}
                        onChange={(v) => updateNodeData(node.id, 'waveScale', v)}
                        step={0.1}
                        min={0.01}
                        className="w-14"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-500">Distort</span>
                      <DragNumber
                        value={node.data.distortion ?? 0}
                        onChange={(v) => updateNodeData(node.id, 'distortion', v)}
                        step={0.1}
                        min={0}
                        className="w-14"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-500">Detail</span>
                      <DragNumber
                        value={node.data.detail ?? 0}
                        onChange={(v) => updateNodeData(node.id, 'detail', v)}
                        step={0.1}
                        min={0}
                        className="w-14"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-500">D.Scale</span>
                      <DragNumber
                        value={node.data.detailScale ?? 0}
                        onChange={(v) => updateNodeData(node.id, 'detailScale', v)}
                        step={0.5}
                        min={0}
                        className="w-14"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-500">Rough</span>
                      <DragNumber
                        value={node.data.detailRoughness ?? 0}
                        onChange={(v) => updateNodeData(node.id, 'detailRoughness', v)}
                        step={0.05}
                        min={0}
                        max={1}
                        className="w-14"
                      />
                    </div>
                  </div>
                )}

                {node.type === NodeType.PARAMETER && (
                  <div className="space-y-2 bg-[#2a2a2a] p-1 rounded">
                    {/* Label Input */}
                    <input
                        type="text"
                        value={node.data.label || 'Param'}
                        onChange={(e) => updateNodeData(node.id, 'label', e.target.value)}
                        className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-2 py-1 text-xs text-yellow-500 font-bold focus:outline-none focus:border-yellow-500 mb-1"
                        placeholder="Label"
                        onMouseDown={e => e.stopPropagation()} 
                    />

                    {/* Base Value Input */}
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-500">Center Value</span>
                        <DragNumber
                            value={node.data.value ?? 0}
                            onChange={(v) => updateNodeData(node.id, 'value', v)}
                            step={0.01}
                            className="w-20 text-yellow-500 font-mono"
                        />
                    </div>

                    {/* Spread Input */}
                    <div className="flex justify-between items-center bg-[#1a1a1a] p-1 rounded border border-gray-700">
                        <span className="text-[10px] text-gray-400">Step Difference</span>
                        <DragNumber
                            value={node.data.spread ?? 0.1}
                            onChange={(v) => updateNodeData(node.id, 'spread', v)}
                            step={0.001}
                            precision={3}
                            className="w-20 text-blue-400 font-mono"
                        />
                    </div>
                    <div className="text-[9px] text-gray-500 text-center pt-1">
                        Range ≈ {(node.data.value ?? 0).toFixed(2)} ± {((node.data.spread ?? 0.1) * 50).toFixed(2)}
                    </div>
                  </div>
                )}

                {node.type === NodeType.OUTPUT && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-500">Resolution</span>
                      <DragNumber
                        value={node.data.resolution ?? 64}
                        onChange={(v) => updateNodeData(node.id, 'resolution', Math.round(v))}
                        step={1}
                        min={8}
                        max={512}
                        precision={0}
                        className="w-14"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-500">Layer H</span>
                      <DragNumber
                        value={node.data.layerHeight ?? 0.1}
                        onChange={(v) => updateNodeData(node.id, 'layerHeight', v)}
                        step={0.01}
                        min={0.01}
                        max={1}
                        className="w-14"
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
                      ref={(el) => registerSocket(`${node.id}-out-${output}`, el)}
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
