import React from 'react';
import { DEMO_PRESETS } from '../../hooks/usePatternEngine';

interface PresetSwitcherProps {
  activePresetIndex: number;
  isCustomActive: boolean;
  customPreset: typeof DEMO_PRESETS[0] | null;
  onSelectPreset: (index: number) => void;
  onSelectCustom: () => void;
}

export const PresetSwitcher: React.FC<PresetSwitcherProps> = ({
  activePresetIndex,
  isCustomActive,
  customPreset,
  onSelectPreset,
  onSelectCustom
}) => {
  return (
    <div className="order-1 md:order-none w-full fade-in-up" style={{ animationDelay: '0.2s' }}>
      <div className="border-b border-zinc-800 pb-4 mb-6 md:mb-0">
        <h2 className="text-lg md:text-xl font-mono uppercase tracking-widest text-white mb-2">Play with Complexity</h2>
        <p className="text-xs text-zinc-500 font-mono uppercase tracking-tight mb-4">Select a pattern to explore</p>
        
        <div className="flex gap-2">
           {DEMO_PRESETS.map((preset, idx) => (
              <button
                  key={preset.id}
                  onClick={() => onSelectPreset(idx)}
                  className={`flex-1 py-1 text-xs uppercase tracking-wider font-medium border rounded transition-colors ${
                      !isCustomActive && activePresetIndex === idx 
                      ? "bg-white text-black border-white" 
                      : "bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300"
                  }`}
              >
                  {preset.name}
              </button>
           ))}
           {/* Shared Preset Tab (only visible when loaded from URL) */}
           {customPreset && (
              <button
                  onClick={onSelectCustom}
                  className={`flex-1 py-1 text-xs uppercase tracking-wider font-medium border rounded transition-colors ${
                      isCustomActive 
                      ? "bg-zinc-100 text-black border-zinc-100" 
                      : "bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-500 hover:text-zinc-300"
                  }`}
              >
                  Shared
              </button>
           )}
        </div>
      </div>
    </div>
  );
};
