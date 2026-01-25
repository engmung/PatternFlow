import React from 'react';

interface GridSettingsProps {
  resolution: number;
  layerHeight: number;
  onResolutionChange: (val: number) => void;
  onHeightChange: (val: number) => void;
}

export const GridSettings: React.FC<GridSettingsProps> = ({
  resolution,
  layerHeight,
  onResolutionChange,
  onHeightChange
}) => {
  return (
    <div className="mb-2">
        <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-4">Grid Settings</h3>
        
        {/* Resolution */}
        <div className="mb-3 group">
            <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs uppercase tracking-widest text-gray-300 font-medium group-hover:text-white transition-colors">
                Grid Resolution
                </label>
                <span className="text-xs font-mono text-gray-400 group-hover:text-white">{resolution}</span>
            </div>
            <div className="relative h-4 flex items-center">
                <input
                type="range"
                min={2}
                max={100}
                step={1}
                value={resolution}
                onChange={(e) => onResolutionChange(parseInt(e.target.value))}
                className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                />
            </div>
        </div>

        {/* Height */}
        <div className="mb-3 group">
            <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs uppercase tracking-widest text-gray-300 font-medium group-hover:text-white transition-colors">
                Height Scale
                </label>
                <span className="text-xs font-mono text-gray-400 group-hover:text-white">{layerHeight.toFixed(2)}</span>
            </div>
            <div className="relative h-4 flex items-center">
                <input
                type="range"
                min={0.01}
                max={5}
                step={0.001}
                value={layerHeight}
                onChange={(e) => onHeightChange(parseFloat(e.target.value))}
                className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                />
            </div>
        </div>
    </div>
  );
};
