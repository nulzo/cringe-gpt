import { useHotkeys } from 'react-hotkeys-hook';
import { useNavigate } from 'react-router-dom';
import { useHotkeyConfigStore } from '@/stores/hotkey-store';
import { type ActionId } from '@/configuration/hotkeys';
import { useMemo } from 'react';

// Normalize 'mod' to platform-specific bindings understood by hotkeys-js
// - On macOS: generate both 'meta' and 'command' for broader compatibility
// - On others: use 'ctrl'
function normalizeBinding(keys: string): string {
    const isMac = /^Mac/.test(navigator.platform);
    if (/mod/i.test(keys)) {
        if (isMac) {
            const meta = keys.replace(/mod/gi, 'meta');
            const command = keys.replace(/mod/gi, 'command');
            return `${meta}, ${command}`;
        }
        return keys.replace(/mod/gi, 'ctrl');
    }
    return keys;
}

interface GlobalHotkeyBinderProps {
    onOpenCommandPalette: () => void;
}

export function GlobalHotkeyBinder({ onOpenCommandPalette }: GlobalHotkeyBinderProps) {
    const navigate = useNavigate();
    const configs = useHotkeyConfigStore((state) => state.configs);

    // Map action IDs to their handler functions
    // useMemo ensures this map isn't recreated on every render
    const actionHandlers = useMemo<Record<ActionId, (e: KeyboardEvent) => void>>(() => ({
        'command.openPalette': (e) => {
            e.preventDefault();
            onOpenCommandPalette();
        },
        'navigation.newChat': (e) => {
            e.preventDefault();
            navigate('/');
        },
        'navigation.goToKlim': (e) => {
            e.preventDefault();
            navigate('/klim');
        },
        'general.save': (e) => {
            e.preventDefault();
            alert('Saved!');
        }
    }), [navigate, onOpenCommandPalette]);

    // Render a child per hotkey to satisfy Rules of Hooks
    return (
        <>
            {Object.entries(configs).map(([actionId, config]) => {
                const handler = actionHandlers[actionId as ActionId];
                if (!handler) return null;
                return (
                    <Hotkey
                        key={actionId}
                        keys={config.keys}
                        handler={handler}
                    />
                );
            })}
        </>
    );
}

function Hotkey({ keys, handler }: { keys: string; handler: (e: KeyboardEvent) => void }) {
    // normalize at registration point
    const normalized = useMemo(() => normalizeBinding(keys), [keys]);
    useHotkeys(normalized, handler, { enableOnFormTags: true }, [handler, normalized]);
    return null;
}