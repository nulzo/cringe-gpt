import { create } from 'zustand';

interface UnsavedState {
    dirty: boolean;
    setDirty: (v: boolean) => void;
    reset: () => void;
}

export const useUnsavedStore = create<UnsavedState>((set) => ({
    dirty: false,
    setDirty: (dirty) => set({ dirty }),
    reset: () => set({ dirty: false }),
}));