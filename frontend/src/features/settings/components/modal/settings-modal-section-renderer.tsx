import { Suspense, lazy } from 'react';
import { useSettingsSection } from '../../hooks/use-settings-section';

const AppearanceSection = lazy(() => import('../sections/appearance-settings-section'));
const AISection = lazy(() => import('../sections/ai-settings-section'));

export const SectionRenderer = () => {
    const active = useSettingsSection((s) => s.active);

    const Component =
        {
            appearance: AppearanceSection,
            ai: AISection,
        }[active] ?? (() => <div>Select a section</div>);

    return (
        <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
            <Component />
        </Suspense>
    );
};