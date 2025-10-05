import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTheme } from '@/shared/ui/theme';
import { IconDeviceDesktop, IconSun, IconMoon } from '@tabler/icons-react';
import {Separator} from "@/components/ui/separator.tsx";
import {AccentColorPicker} from "@/features/settings/components/accent-color-picker.tsx";

const AppearanceSection = () => {
    const { theme, setTheme } = useTheme();

    return (
        <div className="space-y-6">
            <header>
                <h3 className="text-lg font-medium">Appearance</h3>
                <p className="text-sm text-muted-foreground">
                    Choose theme & accent colour
                </p>
            </header>

            {/* Theme switch */}
            <RadioGroup
                value={theme}
                onValueChange={setTheme}
                className="grid grid-cols-3 gap-4 pt-2"
            >
                {[['light', IconSun], ['dark', IconMoon], ['system', IconDeviceDesktop]].map(
                    ([v, Icon]) => (
                        <label
                            key={v}
                            className="flex flex-col items-center p-4 border rounded-md cursor-pointer
                [&:has([data-state=checked])]:ring-2 [&:has([data-state=checked])]:ring-primary"
                        >
                            <RadioGroupItem value={v as string} id={v as string} className="sr-only" />
                            <Icon className="w-6 h-6 mb-2" />
                            {v.charAt(0).toUpperCase() + v.slice(1)}
                        </label>
                    ),
                )}
            </RadioGroup>

            {/* Accent */}
            <Separator />

            <div>
                <h3 className="mb-2 font-medium text-lg">Accent Colors</h3>
                <p className="mb-4 text-muted-foreground text-sm">
                    Use system or custom accent colors
                </p>
                <AccentColorPicker />
            </div>

            <Separator />
        </div>
    );
};

export default AppearanceSection;