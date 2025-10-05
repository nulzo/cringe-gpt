import {create} from 'zustand';

interface LayoutStore {
    isSettingsModalOpen: boolean;
    toggleSettingsModal: () => void;
    isCommandPaletteOpen: boolean;
    setCommandPaletteOpen: (isOpen: boolean) => void;
}

export const useLayoutStore = create<LayoutStore>((set) => ({
    isSettingsModalOpen: false,
    toggleSettingsModal: () => set((state) => ({isSettingsModalOpen: !state.isSettingsModalOpen})),
    isCommandPaletteOpen: false,
    setCommandPaletteOpen: (isOpen) => set({isCommandPaletteOpen: isOpen}),
})); 