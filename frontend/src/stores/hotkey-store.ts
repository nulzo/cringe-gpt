import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { type ActionId, hotkeyActions } from '@/configuration/hotkeys';

export interface HotkeyConfig {
    keys: string;
}

interface HotkeyConfigState {
    configs: Record<ActionId, HotkeyConfig>;
    setHotkey: (id: ActionId, keys: string) => void;
    resetHotkey: (id: ActionId) => void;
    resetAllHotkeys: () => void;
}

const getDefaultConfigs = (): Record<ActionId, HotkeyConfig> => {
    return Object.fromEntries(
        Object.entries(hotkeyActions).map(([id, action]) => [
            id,
            { keys: action.defaultKeys },
        ])
    ) as Record<ActionId, HotkeyConfig>;
};

export const useHotkeyConfigStore = create<HotkeyConfigState>()(
    persist(
        (set) => ({
            configs: getDefaultConfigs(),

            setHotkey: (id, keys) =>
                set((state) => ({
                    configs: { ...state.configs, [id]: { keys } },
                })),

            resetHotkey: (id) =>
                set((state) => ({
                    configs: {
                        ...state.configs,
                        [id]: { keys: hotkeyActions[id].defaultKeys },
                    },
                })),

            resetAllHotkeys: () => set({ configs: getDefaultConfigs() }),
        }),
        {
            name: 'user-hotkey-configuration', // Unique name for localStorage
            storage: createJSONStorage(() => localStorage),
            // The `merge` function is crucial. It combines the stored state
            // with the initial state, ensuring new hotkeys are added automatically.
            merge: (persistedState, currentState) => {
                const merged = { ...currentState, ...persistedState };
                // Ensure all actions from the default config are present
                for (const actionId in hotkeyActions) {
                    if (!merged.configs[actionId as ActionId]) {
                        merged.configs[actionId as ActionId] = { keys: hotkeyActions[actionId as ActionId].defaultKeys };
                    }
                }
                return merged;
            },
        }
    )
);

/**
 * Reads the current binding for an action.
 * Falls back to the default if the user never changed it.
 */
export const useHotkey = (id: ActionId) =>
    useHotkeyConfigStore((s) => s.configs[id]?.keys ?? hotkeyActions[id].defaultKeys);

/**
 * Same as useHotkey but already formatted for UI (⌘ + O, Ctrl + O, …)
 */
export const useHotkeyDisplay = (id: ActionId) => {
    const shortcut = useHotkey(id);

    // You can keep this converter anywhere you like.
    const isMac = /^Mac/.test(navigator.platform);
    return shortcut
        .replace(/mod/i, isMac ? "⌘" : "Ctrl")
        .replace(/\+/g, " + ")            // nicer spacing
        .toUpperCase();
};
