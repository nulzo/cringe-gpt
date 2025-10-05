// src/stores/theme-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isLightColor } from "@/utils/color-utils";

const applyAccent = (c: string) => {
    const root = document.documentElement;
    root.style.setProperty("--primary", c);
    root.style.setProperty("--ring", c);
    root.style.setProperty(
        "--primary-foreground",
        isLightColor(c) ? "oklch(0.14 0.005 285)" : "oklch(1 0 0)"
    );
};

interface State {
    accentColor: string;
    setAccentColor: (c: string) => void;
    reset: () => void;
}

export const useAccentColorStore = create<State>()(
    persist(
        (set) => ({
            accentColor: "oklch(0.645 0.246 16.439)",
            setAccentColor: (c) => set({ accentColor: c }),
            reset: () => set((s) => ({ accentColor: s.accentColor })),
        }),
        { name: "accent-color" }
    )
);

if (typeof document !== "undefined") {
    applyAccent(useAccentColorStore.getState().accentColor);
    useAccentColorStore.subscribe(
        (s) => s.accentColor,
        (c) => applyAccent(c)
    );
}