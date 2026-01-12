import React, { useCallback } from 'react';
import { PatternConfig, PatternType } from '../types';

interface PatternControlsProps {
  config: PatternConfig;
  onChange: (newConfig: PatternConfig) => void;
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

const Slider: React.FC<SliderProps> = React.memo(({ label, value, min, max, step, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  };

  return (
    <div className="mb-6 group">
      <div className="flex justify-between items-center mb-2">
        <label className="text-xs uppercase tracking-widest text-gray-300 font-medium group-hover:text-white transition-colors">
          {label}
        </label>
        <span className="text-xs font-mono text-gray-400 group-hover:text-white">{value.toFixed(2)}</span>
      </div>
      <div className="relative h-6 flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          onInput={handleChange}
          className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-grab active:cursor-grabbing focus:outline-none slider-thumb"
          aria-label={`Adjust ${label}`}
        />
      </div>
    </div>
  );
});

const PatternControls: React.FC<PatternControlsProps> = ({ config, onChange }) => {
  const handleScaleChange = useCallback((value: number) => {
    onChange({ ...config, scale: value });
  }, [config, onChange]);

  const handleRoughnessChange = useCallback((value: number) => {
    onChange({ ...config, roughness: value });
  }, [config, onChange]);

  const handleSpeedChange = useCallback((value: number) => {
    onChange({ ...config, speed: value });
  }, [config, onChange]);

  const handleTypeChange = (type: PatternType) => {
    onChange({ ...config, type });
  };

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
      
      <div className="mb-8">
        <label className="block text-xs uppercase tracking-widest text-gray-300 font-medium mb-3">
          Pattern Type
        </label>
        <div className="flex space-x-4">
          <button
            onClick={() => handleTypeChange(PatternType.NOISE)}
            className={`flex-1 py-2 px-4 text-sm transition-all duration-300 border ${
              config.type === PatternType.NOISE
                ? 'border-white bg-white text-black'
                : 'border-zinc-600 text-gray-300 hover:border-gray-400 hover:text-white'
            }`}
          >
            Noise
          </button>
          <button
            onClick={() => handleTypeChange(PatternType.RING_WAVE)}
            className={`flex-1 py-2 px-4 text-sm transition-all duration-300 border ${
              config.type === PatternType.RING_WAVE
                ? 'border-white bg-white text-black'
                : 'border-zinc-600 text-gray-300 hover:border-gray-400 hover:text-white'
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
        max={50} 
        step={0.5} 
        onChange={handleScaleChange} 
      />
      
      <Slider 
        label="Roughness" 
        value={config.roughness} 
        min={0} 
        max={1} 
        step={0.01} 
        onChange={handleRoughnessChange} 
      />
      
      <Slider 
        label="Flow Speed" 
        value={config.speed} 
        min={0} 
        max={2} 
        step={0.05} 
        onChange={handleSpeedChange} 
      />
    </div>
  );
};

export default PatternControls;