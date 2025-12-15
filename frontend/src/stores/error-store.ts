import { create } from "zustand";

type ErrorState = {
  globalError: string | null;
  setGlobalError: (msg: string | null) => void;
};

export const useErrorStore = create<ErrorState>((set) => ({
  globalError: null,
  setGlobalError: (msg) => set({ globalError: msg }),
}));
