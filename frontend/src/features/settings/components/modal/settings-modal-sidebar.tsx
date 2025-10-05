import { Button } from '@/components/ui/button';
import {
    IconSettings,
    IconPalette,
    IconCpu,
} from '@tabler/icons-react';
import { useSettingsSection } from '../../hooks/use-settings-section';

const SECTIONS = [
    { id: 'appearance', label: 'Appearance', icon: IconPalette },
    { id: 'ai', label: 'AI Providers', icon: IconCpu },
    { id: 'general', label: 'General', icon: IconSettings },
] as const;

export const Sidebar = () => {
    const { active, setActive } = useSettingsSection((s) => s);

    return (
        <aside className="flex flex-col flex-shrink-0 p-4 border-r w-64">
            <h2 className="text-lg font-semibold mb-4">Settings</h2>
            <nav className="flex flex-col space-y-1">
                HEYYYY
                {SECTIONS.map(({ id, label, icon: Icon }) => (
                    <Button
                        key={id}
                        variant={active === id ? 'secondary' : 'ghost'}
                        className="justify-start gap-2"
                        onClick={() => setActive(id)}
                    >
                        <Icon size={18} />
                        {label}
                    </Button>
                ))}
            </nav>
        </aside>
    );
};