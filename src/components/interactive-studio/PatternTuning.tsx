import React from 'react';
import { DEMO_PRESETS } from '../../presets/demoPreset';

interface PatternTuningProps {
  currentPreset: typeof DEMO_PRESETS[0];
  paramValues: Record<string, number>;
  onParamChange: (paramId: string, value: number) => void;
}

export const PatternTuning: React.FC<PatternTuningProps> = ({
  currentPreset,
  paramValues,
  onParamChange
}) => {
  return (
    <div className="mb-6">
       <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-4">Pattern Tuning</h3>
       {currentPreset.parameters.map((param, idx) => (
          <div key={param.id} className="mb-3 group">
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs uppercase tracking-widest text-gray-300 font-medium group-hover:text-white transition-colors">
                {param.label}
              </label>
              <span className="text-xs font-mono text-gray-400 group-hover:text-white">
                  {(paramValues[param.id] ?? param.default).toFixed(2)}
              </span>
            </div>
            <div className="relative h-4 flex items-center">
              <input
                type="range"
                min={param.min}
                max={param.max}
                step={param.step}
                value={paramValues[param.id] ?? param.default}
                onChange={(e) => onParamChange(param.id, parseFloat(e.target.value))}
                className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-grab active:cursor-grabbing focus:outline-none slider-thumb"
              />
            </div>
          </div>
      ))}
      {currentPreset.parameters.length === 0 && (
          <div className="text-xs text-zinc-600 text-center py-2 mb-2">No adjustable parameters</div>
      )}
    </div>
  );
};
