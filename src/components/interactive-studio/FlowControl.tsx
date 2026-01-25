import React, { Children } from 'react';
import { Play, Pause } from 'lucide-react';

interface FlowControlProps {
  speed: number;
  isPaused: boolean;
  onSpeedChange: (speed: number) => void;
  onPauseToggle: () => void;
  children?: React.ReactNode; // For ColorPalette injection if needed, or we just put Palette below
}

export const FlowControl: React.FC<FlowControlProps> = ({
  speed,
  isPaused,
  onSpeedChange,
  onPauseToggle,
  children
}) => {
  return (
    <div className="order-4 md:order-none w-full bg-zinc-900/50 p-6 rounded-sm border border-zinc-800/50 flex flex-col gap-4 fade-in-up" style={{ animationDelay: '0.5s' }}>
        <h3 className="text-xs font-mono uppercase tracking-widest text-white">Flow Control</h3>
        
        {/* Speed Slider */}
        <div className="mb-2 group">
            <div className="flex justify-between items-center mb-2">
                <label className="text-xs uppercase tracking-widest text-gray-300 font-medium group-hover:text-white transition-colors">
                    Flow Speed
                </label>
                <span className="text-xs font-mono text-gray-400 group-hover:text-white">{speed.toFixed(1)}x</span>
            </div>
            <div className="relative h-6 flex items-center">
                <input
                    type="range"
                    min={-10}
                    max={10}
                    step={0.01}
                    value={speed}
                    onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                    className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                />
            </div>
        </div>

        <button 
            onClick={onPauseToggle}
            className={`flex items-center justify-center gap-2 w-full py-2 px-4 text-sm font-medium transition-colors border ${
            isPaused 
            ? 'bg-white text-black border-white hover:bg-gray-200' 
            : 'bg-transparent text-gray-300 border-zinc-700 hover:border-gray-400 hover:text-white'
            }`}
        >
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
            {isPaused ? 'RESUME FLOW' : 'PAUSE FLOW'}
        </button>

        <div className="h-px bg-zinc-800/50 w-full my-1"></div>

        {/* Children (Color Palette usually goes here in original design) */}
        {children}
    </div>
  );
};
