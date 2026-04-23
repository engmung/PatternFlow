import { create } from 'zustand';

export type SectionType = 'hero' | 'case' | 'pcb' | 'assembly' | 'firmware' | 'inside';

interface AppState {
  activeSection: SectionType;
  setActiveSection: (section: SectionType) => void;
  knobValues: {
    c1: number;
    c2: number;
    c3: number;
    c4: number;
  };
  setKnobValue: (knobId: 'c1' | 'c2' | 'c3' | 'c4', value: number) => void;
  isDraggingKnob: boolean;
  setIsDraggingKnob: (isDragging: boolean) => void;
  activeKnobId: 'c1' | 'c2' | 'c3' | 'c4' | null;
  setActiveKnobId: (id: 'c1' | 'c2' | 'c3' | 'c4' | null) => void;
  isBloomEnabled: boolean;
  setIsBloomEnabled: (enabled: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeSection: 'hero',
  setActiveSection: (section) => set({ activeSection: section }),
  knobValues: {
    c1: 0.00, // Hue
    c2: 2.00, // Speed
    c3: 0.00, // Mode
    c4: 0.06, // Freq
  },
  setKnobValue: (knobId, value) =>
    set((state) => ({
      knobValues: {
        ...state.knobValues,
        [knobId]: value,
      },
    })),
  isDraggingKnob: false,
  setIsDraggingKnob: (isDragging) => set({ isDraggingKnob: isDragging }),
  activeKnobId: null,
  setActiveKnobId: (id) => set({ activeKnobId: id }),
  isBloomEnabled: true,
  setIsBloomEnabled: (enabled) => set({ isBloomEnabled: enabled }),
}));
