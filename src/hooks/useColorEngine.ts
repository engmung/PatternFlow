import { useState, useRef, useCallback, useEffect } from 'react';
import { ColorRampStop } from '../studio/types';

// Utility: HSL to Hex
const hslToHex = (h: number, s: number, l: number) => {
  h = h % 360;
  if (h < 0) h += 360;
  s = Math.max(0, Math.min(100, s));
  l = Math.max(0, Math.min(100, l));
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

export function useColorEngine(
  colors: ColorRampStop[],
  setColors: React.Dispatch<React.SetStateAction<ColorRampStop[]>>,
  defaultColors: ColorRampStop[] 
) {
  const gradientRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [activeHandleIndex, setActiveHandleIndex] = useState<number | null>(null);
  
  // Ref for accessing specific index during color picker change without closure staleness if needed
  const editingIndexRef = useRef<number | null>(null); 

  const randomizeColors = useCallback(() => {
    const harmony = Math.floor(Math.random() * 4); // 0: Mono, 1: Analogous, 2: Complimentary, 3: Vibrant
    const baseHue = Math.floor(Math.random() * 360);
    const baseS = 40 + Math.random() * 40; 
    const invert = Math.random() > 0.5;

    setColors(prevColors => prevColors.map((stop, i) => {
        const count = Math.max(1, prevColors.length - 1);
        let t = i / count;
        if (invert) t = 1.0 - t;

        let h = baseHue;
        let s = baseS;
        let l = 50;

        switch(harmony) {
            case 1: // Analogous
                h = (baseHue + t * 40) % 360; 
                s = 40 + Math.random() * 20;
                l = 10 + t * 80;
                break;
            case 2: // Complimentary
                h = (baseHue + t * 180) % 360; 
                s = 70;
                l = 20 + t * 60; 
                break;
            case 3: // Vibrant
                h = (baseHue + t * 120) % 360; 
                s = 80 + Math.random() * 20;
                l = t < 0.5 ? 10 + t * 40 : 50 + (t - 0.5) * 40; 
                break;
            case 0: // Mono
            default:
                h = (baseHue + Math.random() * 10 - 5) % 360; 
                s = baseS;
                l = 10 + Math.pow(t, 0.8) * 85; 
                break;
        }
        return { ...stop, color: hslToHex(h, s, l) };
    }));
  }, [setColors]);

  const resetColors = useCallback(() => {
    setColors(defaultColors);
  }, [setColors, defaultColors]);

  const handleStopDrag = useCallback((e: MouseEvent) => {
    if (draggingIndex === null || !gradientRef.current) return;
    const rect = gradientRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const position = Math.max(0, Math.min(1, x / rect.width));
    
    setColors(prev => {
        const newColors = [...prev];
        // Ensure dragging index is valid, though it should be if state is consistent
        if (newColors[draggingIndex]) {
           newColors[draggingIndex] = { ...newColors[draggingIndex], position };
           return newColors.sort((a, b) => a.position - b.position);
        }
        return prev;
    });
  }, [draggingIndex, setColors]);

  const handleStopDragEnd = useCallback(() => {
    setDraggingIndex(null);
  }, []);

  // Add Window Event Listeners for Dragging
  useEffect(() => {
    if (draggingIndex !== null) {
      window.addEventListener('mousemove', handleStopDrag);
      window.addEventListener('mouseup', handleStopDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleStopDrag);
      window.removeEventListener('mouseup', handleStopDragEnd);
    };
  }, [draggingIndex, handleStopDrag, handleStopDragEnd]);

  const handleColorPick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const targetIdx = editingIndexRef.current;
      if (targetIdx !== null) {
          setColors(prev => {
              const newColors = [...prev];
              if (newColors[targetIdx]) {
                  newColors[targetIdx] = { ...newColors[targetIdx], color: e.target.value };
              }
              return newColors;
          });
      }
  }, [setColors]);

  return {
    state: {
      gradientRef, colorInputRef,
      draggingIndex, activeHandleIndex, editingIndexRef
    },
    actions: {
      setDraggingIndex, setActiveHandleIndex,
      randomizeColors, resetColors,
      handleStopDrag, handleStopDragEnd, handleColorPick
    },
    utils: { hslToHex }
  };
}
