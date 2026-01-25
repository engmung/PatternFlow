import { useState, useRef, useEffect } from 'react';
import { Node, Connection, ColorRampStop, NodeType } from '../studio/types';
import { DEMO_PRESETS } from '../presets/demoPreset';
import { getPresetFromUrl } from '../utils/urlSharing';

export interface PatternEngineState {
  nodes: Node[];
  connections: Connection[];
  colors: ColorRampStop[];
  speed: number;
  resolution: number;
  layerHeight: number;
  isPaused: boolean;
  paramValues: Record<string, number>;
  activePresetIndex: number;
  isCustomActive: boolean;
  customPreset: typeof DEMO_PRESETS[0] | null;
  currentPreset: typeof DEMO_PRESETS[0];
}

export interface PatternEngineActions {
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setConnections: React.Dispatch<React.SetStateAction<Connection[]>>;
  setColors: React.Dispatch<React.SetStateAction<ColorRampStop[]>>;
  setSpeed: (speed: number) => void;
  setResolution: (res: number) => void;
  setLayerHeight: (height: number) => void;
  setIsPaused: (paused: boolean) => void;
  setParamValues: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setActivePresetIndex: (index: number) => void;
  setIsCustomActive: (active: boolean) => void;
  setCustomPreset: React.Dispatch<React.SetStateAction<typeof DEMO_PRESETS[0] | null>>;
  handleParamChange: (paramId: string, value: number) => void;
}

export function usePatternEngine() {
  const [activePresetIndex, setActivePresetIndex] = useState(0);
  const [customPreset, setCustomPreset] = useState<typeof DEMO_PRESETS[0] | null>(null);
  const [isCustomActive, setIsCustomActive] = useState(false);
  
  // Determine current preset
  const currentPreset = isCustomActive && customPreset ? customPreset : DEMO_PRESETS[activePresetIndex];

  // Engine State
  // Engine State
  const [nodes, setNodes] = useState<Node[]>(currentPreset.nodes);
  const [connections, setConnections] = useState<Connection[]>(currentPreset.connections);
  const [colors, setColors] = useState<ColorRampStop[]>(currentPreset.colorRamp);
  const [isPaused, setIsPaused] = useState(false);
  
  const [speed, setSpeed] = useState(() => {
    const timeNode = currentPreset.nodes.find(n => n.type === NodeType.TIME);
    return timeNode?.data.speed ?? 1.0;
  });
  
  const [resolution, setResolution] = useState(() => {
    const outNode = currentPreset.nodes.find(n => n.type === NodeType.OUTPUT);
    return outNode?.data.resolution ?? 40;
  });
  
  const [layerHeight, setLayerHeight] = useState(() => {
    const outNode = currentPreset.nodes.find(n => n.type === NodeType.OUTPUT);
    return outNode?.data.layerHeight ?? 0.2;
  });

  const [paramValues, setParamValues] = useState<Record<string, number>>({});

  const urlPresetLoadedRef = useRef(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Load preset from URL on mount
  useEffect(() => {
    const urlPreset = getPresetFromUrl();
    if (urlPreset) {
      urlPresetLoadedRef.current = true;
      
      const sharedPreset: typeof DEMO_PRESETS[0] = {
        id: 'shared',
        name: 'Shared',
        description: 'Pattern loaded from shared URL',
        author: 'Community',
        version: 1,
        nodes: urlPreset.nodes,
        connections: urlPreset.connections,
        colorRamp: urlPreset.colorRamp,
        parameters: urlPreset.nodes
          .filter(n => n.type === NodeType.PARAMETER)
          .map(n => ({
            id: `param-${n.id}`,
            label: n.data.label || 'Param',
            nodeId: n.id,
            property: 'value',
            min: n.data.min ?? 0,
            max: n.data.max ?? 10,
            default: n.data.value ?? 5,
            step: n.data.spread ?? 0.1,
            sensitivity: 1
          })),
        gridResolution: urlPreset.gridResolution ?? 40
      };
      
      setCustomPreset(sharedPreset);
      setIsCustomActive(true);
      setNodes(sharedPreset.nodes);
      setConnections(sharedPreset.connections);
      setColors(sharedPreset.colorRamp);
      
      // Load Settings from Nodes
      const timeNode = sharedPreset.nodes.find(n => n.type === NodeType.TIME);
      if (timeNode?.data.speed) setSpeed(timeNode.data.speed);

      const outNode = sharedPreset.nodes.find(n => n.type === NodeType.OUTPUT);
      if (outNode) {
          if (outNode.data.resolution) setResolution(outNode.data.resolution);
          if (outNode.data.layerHeight) setLayerHeight(outNode.data.layerHeight);
      }
      
      // Initialize param values
      const initialParams: Record<string, number> = {};
      sharedPreset.parameters.forEach(p => {
        initialParams[p.id] = p.default;
      });
      setParamValues(initialParams);
    }
  }, []);

  // Handle Preset Switching
  useEffect(() => {
    // Skip if URL preset just loaded
    if (!initialLoadDone) {
      setInitialLoadDone(true);
      if (urlPresetLoadedRef.current) return;
    }

    let preset = DEMO_PRESETS[activePresetIndex];
    if (isCustomActive && customPreset) {
        preset = customPreset;
    }

    setNodes(preset.nodes);
    setConnections(preset.connections);
    setColors(preset.colorRamp);

    const initialParams: Record<string, number> = {};
    preset.parameters.forEach(p => {
       initialParams[p.id] = p.default;
    });
    setParamValues(initialParams);

    const timeNode = preset.nodes.find(n => n.type === NodeType.TIME);
    if (timeNode?.data.speed) setSpeed(timeNode.data.speed);

    const outNode = preset.nodes.find(n => n.type === NodeType.OUTPUT);
    if (outNode) {
        if (outNode.data.resolution) setResolution(outNode.data.resolution);
        if (outNode.data.layerHeight) setLayerHeight(outNode.data.layerHeight);
    }
    
    setIsPaused(false);
  }, [activePresetIndex, isCustomActive, customPreset]);

  // Update Nodes when Params Change
  useEffect(() => {
    setNodes(prevNodes => prevNodes.map(n => {
        const paramDef = currentPreset.parameters.find(p => p.nodeId === n.id);
        if (paramDef) {
             const val = paramValues[paramDef.id];
             if (val !== undefined && n.data.value !== val) {
                 return { ...n, data: { ...n.data, value: val } };
             }
        }
        return n;
    }));
  }, [paramValues, currentPreset]);

  const handleParamChange = (paramId: string, value: number) => {
    setParamValues(prev => ({
        ...prev,
        [paramId]: value
    }));
  };

  return {
    state: {
      nodes, connections, colors, speed, resolution, layerHeight,
      isPaused, paramValues, activePresetIndex, isCustomActive,
      customPreset, currentPreset
    },
    actions: {
      setNodes, setConnections, setColors, setSpeed, setResolution,
      setLayerHeight, setIsPaused, setParamValues, setActivePresetIndex,
      setIsCustomActive, setCustomPreset, handleParamChange
    }
  };
}
