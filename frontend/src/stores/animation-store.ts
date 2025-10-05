import { create } from "zustand";
import { persist } from "zustand/middleware";

type AnimationStore = {
    animationsEnabled: boolean;
    toggleAnimations: () => void;
    setAnimations: (enabled: boolean) => void;
};

export const useAnimationStore = create<AnimationStore>()(
    persist(
        (set) => ({
            animationsEnabled: true,
            toggleAnimations: () =>
                set((state) => ({ animationsEnabled: !state.animationsEnabled })),
            setAnimations: (enabled) => set({ animationsEnabled: enabled }),
        }),
        {
            name: "animations-enabled",
        }
    )
);
