export type ActionId =
    | 'command.openPalette'
    | 'navigation.newChat'
    | 'navigation.goToKlim'
    | 'general.save';

export interface HotkeyAction {
    id: ActionId;
    label: string; // User-friendly name for the settings UI
    defaultKeys: string; // The default keybinding
}

// This is your single source of truth for all defined actions
export const hotkeyActions: Record<ActionId, HotkeyAction> = {
    'command.openPalette': {
        id: 'command.openPalette',
        label: 'Open Command Palette',
        defaultKeys: 'mod+k',
    },
    'navigation.newChat': {
        id: 'navigation.newChat',
        label: 'Start a New Chat',
        defaultKeys: 'mod+o',
    },
    'navigation.goToKlim': {
        id: 'navigation.goToKlim',
        label: 'Navigate to Klim Page',
        defaultKeys: 'mod+y',
    },
    'general.save': {
        id: 'general.save',
        label: 'Save something',
        defaultKeys: 'mod+s',
    },
};