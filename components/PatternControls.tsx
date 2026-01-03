import React from 'react';
import { PatternConfig, PatternType } from '../types';

interface PatternControlsProps {
  config: PatternConfig;
  onChange: (newConfig: PatternConfig) => void;
}

const PatternControls: React.FC<PatternControlsProps> = ({ config, onChange }) => {
  const handleChange = (key: keyof PatternConfig, value: number | PatternType) => {
    onChange({ ...config, [key]: value });
  };

  const Slider = ({ label, value, min, max, step, configKey }: { label: string, value: number, min: number, max: number, step: number, configKey: keyof PatternConfig }) => (
    <div className="mb-6 group">
      <div className="flex justify-between items-center mb-2">
        <label className="text-xs uppercase tracking-widest text-gray-500 font-medium group-hover:text-gray-300 transition-colors">
          {label}
        </label>
        <span className="text-xs font-mono text-gray-600 group-hover:text-gray-400">{value.toFixed(2)}</span>
      </div>
      <div className="relative h-6 flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => handleChange(configKey, parseFloat(e.target.value))}
          className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer focus:outline-none slider-thumb"
          aria-label={`Adjust ${label}`}
        />
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-sm mt-8 p-6 bg-zinc-900 rounded-sm border border-zinc-800 shadow-sm">
      <style>{`
        .slider-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          background: #ffffff;
          border-radius: 50%;
          cursor: pointer;
          transition: transform 0.1s;
        }
        .slider-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        .slider-thumb::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #ffffff;
          border-radius: 50%;
          cursor: pointer;
          border: none;
          transition: transform 0.1s;
        }
        .slider-thumb::-moz-range-thumb:hover {
          transform: scale(1.2);
        }
      `}</style>
      
      {/* Pattern Type Selector */}
      <div className="mb-8">
        <label className="block text-xs uppercase tracking-widest text-gray-500 font-medium mb-3">
          Pattern Type
        </label>
        <div className="flex space-x-4">
          <button
            onClick={() => handleChange('type', PatternType.NOISE)}
            className={`flex-1 py-2 px-4 text-sm transition-all duration-300 border ${
              config.type === PatternType.NOISE
                ? 'border-white bg-white text-black'
                : 'border-zinc-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'
            }`}
          >
            Noise
          </button>
          <button
            onClick={() => handleChange('type', PatternType.RING_WAVE)}
            className={`flex-1 py-2 px-4 text-sm transition-all duration-300 border ${
              config.type === PatternType.RING_WAVE
                ? 'border-white bg-white text-black'
                : 'border-zinc-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'
            }`}
          >
            Ring Wave
          </button>
        </div>
      </div>

      <Slider 
        label="Scale" 
        value={config.scale} 
        min={1} 
        max={10} 
        step={0.1} 
        configKey="scale" 
      />
      
      <Slider 
        label="Roughness" 
        value={config.roughness} 
        min={0} 
        max={1} 
        step={0.01} 
        configKey="roughness" 
      />
      
      <Slider 
        label="Flow Speed" 
        value={config.speed} 
        min={0} 
        max={2} 
        step={0.05} 
        configKey="speed" 
      />
    </div>
  );
};

export default PatternControls;