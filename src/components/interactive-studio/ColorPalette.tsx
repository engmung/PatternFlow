import React, { useMemo } from 'react';
import { HelpCircle, Palette, RefreshCw, X } from 'lucide-react';
import { ColorRampStop } from '../../studio/types';

interface ColorPaletteProps {
  colors: ColorRampStop[];
  activeHandleIndex: number | null;
  draggingIndex: number | null;
  gradientRef: React.RefObject<HTMLDivElement>;
  colorInputRef: React.RefObject<HTMLInputElement>;
  showColorHelp: boolean;
  
  onRandomize: () => void;
  onReset: () => void;
  onToggleHelp: () => void;
  
  // Logic Handlers
  handleStopDrag: (e: MouseEvent) => void; // This needs to be attached to window/doc? Or just passed?
                                            // Actually InteractiveStudio attached it to window. 
                                            // The hook exposes handleStopDrag which takes a MouseEvent.
                                            // We usually attach this to window onMouseDown. 
                                            // Wait, original code attached mousemove to window if dragging.
                                            // Let's keep the props simple.
  
  // Interaction Handlers (from UI)
  onGradientClick: (e: React.MouseEvent) => void;
  onHandleMouseDown: (e: React.MouseEvent, index: number) => void;
  onHandleClick: (e: React.MouseEvent, index: number) => void;
  onDeleteStop: (e: React.MouseEvent, index: number) => void;
  onColorChangeTrigger: (index: number) => void;
  onColorChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ColorPalette: React.FC<ColorPaletteProps> = ({
  colors,
  activeHandleIndex,
  // draggingIndex is used for some logic but mostly handled in hook? 
  // We need it to maybe show different cursor or style.
  gradientRef,
  colorInputRef,
  showColorHelp,
  onRandomize,
  onReset,
  onToggleHelp,
  onGradientClick,
  onHandleMouseDown,
  onHandleClick,
  onDeleteStop,
  onColorChangeTrigger,
  onColorChange
}) => {
  
  const gradientStyle = useMemo(() => {
    const sorted = [...colors].sort((a, b) => a.position - b.position);
    const colorStops: string[] = [];
    sorted.forEach((stop, i) => {
      const pos = stop.position * 100;
      const nextPos = i < sorted.length - 1 ? sorted[i + 1].position * 100 : 100;
      colorStops.push(`${stop.color} ${pos}%`, `${stop.color} ${nextPos}%`);
    });
    return `linear-gradient(to right, ${colorStops.join(', ')})`;
  }, [colors]);

  return (
    <>
        <div className="flex items-center justify-between mt-2">
            <h3 className="text-xs font-mono uppercase tracking-widest text-white">Color Palette</h3>
                <div className="relative">
                <button 
                    onClick={onToggleHelp}
                    className={`text-zinc-500 hover:text-white transition-colors ${showColorHelp ? "text-white" : ""}`}
                    title="How to edit"
                >
                    <HelpCircle size={16} />
                </button>
                {/* Help Popup */}
                {showColorHelp && (
                    <div className="absolute bottom-full right-0 mb-3 w-64 bg-zinc-900 border border-zinc-700 p-4 rounded-lg shadow-2xl z-[60]">
                        <ul className="space-y-3 text-zinc-300 text-xs leading-relaxed">
                            <li className="flex gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                <span><strong>Click Handle</strong> to Change Color or Delete layer.</span>
                            </li>
                            <li className="flex gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 mt-1.5 shrink-0" />
                                <span><strong>Drag Handle</strong> to adjust position.</span>
                            </li>
                            <li className="flex gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 mt-1.5 shrink-0" />
                                <span><strong>Click Bar</strong> on empty space to Add layer.</span>
                            </li>
                        </ul>
                    </div>
                )}
                </div>
        </div>

        <div className="flex gap-2">
            <button 
            onClick={onRandomize}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs uppercase font-mono bg-transparent text-gray-300 border border-zinc-700 hover:border-white hover:text-white transition-colors rounded-sm"
            >
            <Palette size={14} /> Random
            </button>
            <button 
            onClick={onReset}
            className="flex items-center justify-center py-2 px-3 text-xs uppercase font-mono bg-transparent text-gray-300 border border-zinc-700 hover:border-white hover:text-white transition-colors rounded-sm"
            >
            <RefreshCw size={14} />
            </button>
        </div>
        
        {/* Embedded Interactive Palette */}
        <div className="relative pt-2 pb-1">
            {/* Hidden Color Input for Picker */}
            <input 
                type="color" 
                ref={colorInputRef} 
                className="absolute opacity-0 pointer-events-none"
                onChange={onColorChange}
            />

            {/* Gradient Bar Area */}
            <div 
                ref={gradientRef}
                className="h-6 w-full rounded-sm relative cursor-crosshair border border-zinc-800 bg-zinc-900"
                style={{ background: gradientStyle }}
                onClick={onGradientClick}
            >
                {/* Draggable Handles */}
                {colors.map((stop, idx) => (
                    <div 
                        key={idx} 
                        className="absolute top-0 bottom-0 w-4 ml-[-8px] cursor-ew-resize hover:z-20 group flex justify-center"
                        style={{ left: `${stop.position * 100}%`, zIndex: activeHandleIndex === idx ? 30 : 10 }}
                        onMouseDown={(e) => onHandleMouseDown(e, idx)}
                        onClick={(e) => onHandleClick(e, idx)}
                    >
                        {/* Minimal Line Handle */}
                        <div className={`w-px h-full transition-colors shadow-[0_0_2px_rgba(0,0,0,0.8)] ${activeHandleIndex === idx ? "bg-blue-400 w-0.5" : "bg-white/70 group-hover:bg-white"}`} />
                        
                        {/* Context Menu */}
                        {activeHandleIndex === idx && (
                            <div 
                                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#1a1a1a] border border-zinc-700 rounded-md shadow-2xl flex p-1 gap-1 z-50 cursor-default min-w-[80px]" 
                                onClick={e => e.stopPropagation()}
                                onMouseDown={e => e.stopPropagation()}
                            >
                                {/* Color Swatch Button */}
                                <button 
                                    className="flex-1 h-8 rounded bg-zinc-800 border-zinc-600 border hover:border-white transition-colors flex items-center justify-center relative group/btn"
                                    title="Change Color"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onColorChangeTrigger(idx);
                                    }}
                                >
                                    <div className="w-4 h-4 rounded-full border border-black/20 shadow-sm" style={{backgroundColor: stop.color}}></div>
                                </button>
                                
                                {/* Delete Button */}
                                <button 
                                    className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 hover:bg-red-900/30 hover:border-red-900/50 hover:text-red-400 text-zinc-500 transition-colors flex items-center justify-center"
                                    title={colors.length > 2 ? "Delete Layer" : "Cannot delete (min 2)"}
                                    onClick={(e) => onDeleteStop(e, idx)}
                                    disabled={colors.length <= 2}
                                    style={{ opacity: colors.length <= 2 ? 0.3 : 1 }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    </>
  );
};
