import React, { useMemo } from 'react';
import { Node, Connection, ColorRampStop, GRID_WORLD_SIZE, NodeType } from './types';
import { ReliefGrid } from './ReliefGrid';
import { Text } from '@react-three/drei';

interface GridPreviewProps {
  nodes: Node[];
  connections: Connection[];
  colorRampStops: ColorRampStop[];
  paused: boolean;
  grayscaleMode: boolean;
  onSelectVariation: (nodes: Node[]) => void;
  speed?: number;
  setExportFn?: (fn: () => void) => void;
  timeOffset?: number;
}

const GAP = GRID_WORLD_SIZE * 1.2;

export const GridPreview: React.FC<GridPreviewProps> = ({
  nodes,
  connections,
  colorRampStops,
  paused,
  grayscaleMode,
  onSelectVariation,
  speed = 1.0,
  setExportFn,
  timeOffset = 0,
}) => {
  // Identify Parameter Nodes
  const paramNodes = useMemo(() => {
      return nodes.filter(n => n.type === NodeType.PARAMETER);
  }, [nodes]);

  // Generate 25 variations
  const variations = useMemo(() => {
    const vars = [];
    const param1 = paramNodes.length > 0 ? paramNodes[0] : null;
    const param2 = paramNodes.length > 1 ? paramNodes[1] : null;

    for (let row = -2; row <= 2; row++) {
      for (let col = -2; col <= 2; col++) {
        // Clone nodes deep copy
        const newNodes = JSON.parse(JSON.stringify(nodes)) as Node[];
        
        // Apply variations
        if (param1) {
            const node = newNodes.find(n => n.id === param1.id);
            if (node) {
                const spread = node.data.spread ?? 0.1;
                const center = node.data.value ?? 0;
                // Grid col runs -2 to 2.
                // Variation = step * col.
                // e.g. Spread 0.1: -0.2, -0.1, 0, 0.1, 0.2
                const variation = col * spread * 10; // Scale up for visual distinction in 5x5 grid? 
                
                node.data.value = center + variation;
            }
        }

        if (param2) {
            const node = newNodes.find(n => n.id === param2.id);
            if (node) {
                const spread = node.data.spread ?? 0.1;
                const center = node.data.value ?? 0;
                // Row -2 to 2. 
                // Let's map Row -2 -> -2 * spread.
                const variation = row * spread * 10;
                node.data.value = center + variation;
            }
        }

        vars.push({
          nodes: newNodes,
          x: col * GAP,
          z: row * GAP, 
          isCenter: row === 0 && col === 0,
        });
      }
    }
    return vars;
  }, [nodes, paramNodes]);

  return (
    <group>
      {variations.map((v, i) => (
        <group key={i} position={[v.x, 0, v.z]}>
          <ReliefGrid
            nodes={v.nodes}
            connections={connections}
            colorRampStops={colorRampStops}
            paused={paused}
            grayscaleMode={grayscaleMode}
            setExportFn={v.isCenter ? setExportFn : undefined}
            speed={speed}
            timeOffset={timeOffset}
          />
          
          <mesh 
            position={[0, 2, 0]} 
            visible={false}
            onClick={(e) => {
              e.stopPropagation();
              onSelectVariation(v.nodes);
            }}
            onPointerOver={() => document.body.style.cursor = 'pointer'}
            onPointerOut={() => document.body.style.cursor = 'auto'}
          >
            <boxGeometry args={[GRID_WORLD_SIZE, 5, GRID_WORLD_SIZE]} />
          </mesh>

          {v.isCenter && (
            <mesh position={[0, -0.5, 0]} rotation={[-Math.PI/2, 0, 0]}>
                <planeGeometry args={[GRID_WORLD_SIZE + 2, GRID_WORLD_SIZE + 2]} />
                <meshBasicMaterial color="#44aaff" wireframe />
            </mesh>
          )}
        </group>
      ))}
      
      {/* Labels */}
      {paramNodes[0] && (
        <Text 
          position={[0, 0, 2.7 * GAP]} 
          rotation={[-Math.PI/2, 0, 0]} 
          fontSize={2} 
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {paramNodes[0].data.label || 'Param 1'} (X-Axis)
        </Text>
      )}
      {paramNodes[1] && (
        <Text 
          position={[-2.7 * GAP, 0, 0]} 
          rotation={[-Math.PI/2, 0, Math.PI/2]} 
          fontSize={2} 
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {paramNodes[1].data.label || 'Param 2'} (Z-Axis)
        </Text>
      )}
    </group>
  );
};
