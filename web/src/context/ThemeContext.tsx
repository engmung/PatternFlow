'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type TweaksState = {
  palette: 'cream' | 'paper' | 'stone';
  ledHue: 'orange' | 'red' | 'amber' | 'white';
  sans: 'Inter' | 'DM Sans';
  mono: string;
};

const defaultTweaks: TweaksState = {
  palette: 'cream',
  ledHue: 'orange',
  sans: 'Inter',
  mono: 'JetBrains Mono'
};

const palettes = {
  cream:  { bg: '#F4EFE6', bg2: '#EDE7DB', ink: '#141414', muted: '#6B655A', faint: '#A69F90', rule: '#D9D1C0' },
  paper:  { bg: '#F7F5F0', bg2: '#F0EDE6', ink: '#141414', muted: '#6F6A5F', faint: '#B4AE9F', rule: '#E0DBCE' },
  stone:  { bg: '#E8E3D7', bg2: '#DFD9CA', ink: '#1A1814', muted: '#6A6253', faint: '#9F9683', rule: '#CBC2AE' }
};

export const hues = {
  orange: { r: 232, g: 85, b: 46 },
  red:    { r: 210, g: 40, b: 40 },
  amber:  { r: 235, g: 160, b: 50 },
  white:  { r: 245, g: 238, b: 220 }
};

type ThemeContextType = {
  tweaks: TweaksState;
  setTweaks: React.Dispatch<React.SetStateAction<TweaksState>>;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [tweaks, setTweaks] = useState<TweaksState>(defaultTweaks);

  useEffect(() => {
    const root = document.documentElement;
    const p = palettes[tweaks.palette] || palettes.cream;
    
    root.style.setProperty('--cream', p.bg);
    root.style.setProperty('--cream-2', p.bg2);
    root.style.setProperty('--ink', p.ink);
    root.style.setProperty('--ink-muted', p.muted);
    root.style.setProperty('--ink-faint', p.faint);
    root.style.setProperty('--rule', p.rule);
    
    const h = hues[tweaks.ledHue] || hues.orange;
    root.style.setProperty('--led-hex', `rgb(${h.r}, ${h.g}, ${h.b})`);

    const sansFont = tweaks.sans === 'DM Sans' ? 'var(--font-dm-sans)' : 'var(--font-inter)';
    root.style.setProperty('--sans', `${sansFont}, ui-sans-serif, system-ui, sans-serif`);
    root.style.setProperty('--mono', `var(--font-jetbrains), ui-monospace, monospace`);
    
  }, [tweaks]);

  return (
    <ThemeContext.Provider value={{ tweaks, setTweaks }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
