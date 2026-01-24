import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { ColorRampStop, DEFAULT_COLOR_RAMP_STOPS } from './types';
import { RotateCcw, X } from 'lucide-react';

interface ColorRampUIProps {
  stops: ColorRampStop[];
  setStops: (stops: ColorRampStop[]) => void;
}

export const ColorRampUI: React.FC<ColorRampUIProps> = ({ stops, setStops }) => {
  const [selectedStopIndex, setSelectedStopIndex] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const gradientRef = useRef<HTMLDivElement>(null);

  const sortedStops = useMemo(() => [...stops].sort((a, b) => a.position - b.position), [stops]);

  const gradientStyle = useMemo(() => {
    const colorStops: string[] = [];
    sortedStops.forEach((stop, i) => {
      const pos = stop.position * 100;
      const nextPos = i < sortedStops.length - 1 ? sortedStops[i + 1].position * 100 : 100;
      colorStops.push(`${stop.color} ${pos}%`, `${stop.color} ${nextPos}%`);
    });
    return `linear-gradient(to right, ${colorStops.join(", ")})`;
  }, [sortedStops]);

  const handleGradientClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      if (stops.length >= 8) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const position = Math.max(0, Math.min(1, x / rect.width));
      if (stops.some((s) => Math.abs(s.position - position) < 0.05)) return;
      
      let color = "#808080";
      const sorted = [...stops].sort((a, b) => a.position - b.position);
      for (let i = 0; i < sorted.length - 1; i++) {
        if (position >= sorted[i].position && position <= sorted[i + 1].position) {
          const t = (position - sorted[i].position) / (sorted[i + 1].position - sorted[i].position);
          const c1 = new THREE.Color(sorted[i].color);
          const c2 = new THREE.Color(sorted[i + 1].color);
          c1.lerp(c2, t);
          color = "#" + c1.getHexString();
          break;
        }
      }
      setStops([...stops, { position, color }]);
    }, [stops, setStops]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
      if (draggingIndex === null || !gradientRef.current) return;
      const rect = gradientRef.current.getBoundingClientRect();
      const position = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const newStops = [...stops];
      newStops[draggingIndex] = { ...newStops[draggingIndex], position };
      setStops(newStops);
    }, [draggingIndex, stops, setStops]);

  useEffect(() => {
    if (draggingIndex !== null) {
      window.addEventListener("mousemove", handleMouseMove);
      const end = () => setDraggingIndex(null);
      window.addEventListener("mouseup", end);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", end);
      };
    }
  }, [draggingIndex, handleMouseMove]);

  return (
    <div className="bg-black/90 backdrop-blur text-white p-4 rounded-lg border border-gray-700 w-72 select-none shadow-2xl">
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-sm tracking-tight">Layer Manager</span>
        <button onClick={() => setStops([...DEFAULT_COLOR_RAMP_STOPS])} className="p-1 hover:bg-white/10 rounded transition-colors" title="Reset Colors">
          <RotateCcw size={14} />
        </button>
      </div>

      <div ref={gradientRef} className="h-6 rounded cursor-pointer relative mb-2 border border-white/10" style={{ background: gradientStyle }} onClick={handleGradientClick}>
        {stops.map((stop, idx) => (
          <div key={idx} className={`absolute top-full w-3 h-3 -translate-x-1/2 cursor-grab ${selectedStopIndex === idx ? "z-10" : ""}`} style={{ left: `${stop.position * 100}%` }}
            onMouseDown={(e) => { e.stopPropagation(); setDraggingIndex(idx); setSelectedStopIndex(idx); }}
            onClick={(e) => { e.stopPropagation(); setSelectedStopIndex(idx); }}
          >
            <div className={`w-0 h-0 border-x-[6px] border-x-transparent border-b-[8px] ${selectedStopIndex === idx ? "border-b-blue-400" : "border-b-white/50"}`} />
          </div>
        ))}
      </div>

      <div className="flex justify-between text-[10px] text-gray-500 mb-3 font-mono">
        <span>0.00</span><span>0.50</span><span>1.00</span>
      </div>

      {selectedStopIndex !== null && stops[selectedStopIndex] && (
        <div className="border border-white/5 rounded p-2 mb-3 bg-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-gray-400">Layer {selectedStopIndex + 1}</span>
            {stops.length > 2 && (
              <button onClick={() => { setStops(stops.filter((_, i) => i !== selectedStopIndex)); setSelectedStopIndex(null); }} className="hover:text-red-400 text-gray-500 transition-colors">
                <X size={12} />
              </button>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <input type="color" value={stops[selectedStopIndex].color} onChange={(e) => {
                const ns = [...stops]; ns[selectedStopIndex].color = e.target.value; setStops(ns);
            }} className="w-8 h-8 rounded-md cursor-pointer bg-transparent" />
            <input type="number" step="0.01" value={stops[selectedStopIndex].position.toFixed(2)} onChange={(e) => {
                const ns = [...stops]; ns[selectedStopIndex].position = parseFloat(e.target.value) || 0; setStops(ns);
            }} className="flex-1 bg-black/50 border border-white/10 rounded px-2 py-1 text-xs font-mono" />
          </div>
        </div>
      )}

      <div className="space-y-1">
        {[...sortedStops].reverse().map((stop, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px] text-gray-400">
            <div className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ backgroundColor: stop.color }} />
            <span>Layer {sortedStops.length - i} (Threshold: {stop.position.toFixed(2)})</span>
          </div>
        ))}
      </div>
    </div>
  );
};
