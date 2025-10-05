import { create } from 'zustand';

type SectionId = 'appearance' | 'ai' | 'general' | string;

interface State {
    active: SectionId;
    setActive: (id: SectionId) => void;
}

export const useSettingsSection = create<State>((set) => ({
    active: 'appearance',
    setActive: (active) => set({ active }),
}));