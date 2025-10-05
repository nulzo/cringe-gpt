import { create } from 'zustand';

type UIState = {
    isSettingsModalOpen: boolean;
    isSidebarOpen: boolean;
    openModal: (modal: 'settings' | 'profile' | null) => void;
    currentOpenModal: 'settings' | 'profile' | null;
    toggleSidebar: () => void;
};

export const useUIStore = create<UIState>((set) => ({
    isSettingsModalOpen: false,
    isSidebarOpen: false,
    currentOpenModal: null,
    openModal: (modal) => set({ currentOpenModal: modal }),
    toggleSidebar: () =>
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
