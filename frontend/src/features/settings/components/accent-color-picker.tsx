import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useAccentColorStore } from "@/stores/theme-store";

interface AccentColorPickerProps {
    className?: string;
}

export const PRESET_COLORS: { name: string; value: string }[] = [
    { name: "Default",  value: "oklch(0.645 0.246 16.439)" },
    { name: "Zinc",     value: "oklch(0.58 0.018 286)" },
    { name: "Rose",     value: "oklch(0.65 0.19 13)" },
    { name: "Green",    value: "oklch(0.65 0.17 145)" },
    { name: "Blue",     value: "oklch(0.6 0.18 250)" },
    { name: "Violet",   value: "oklch(0.6 0.19 285)" },
  ];

export function AccentColorPicker({ className }: AccentColorPickerProps) {
    const { accentColor, setAccentColor } = useAccentColorStore();
    const [customHex, setCustomHex] = useState(() => {
        return accentColor.startsWith("#") ? accentColor.substring(1) : "";
    });

    const handlePresetColorClick = (color: string) => {
        setAccentColor(color);
        setCustomHex("");
    };

    const handleHexInputChange = (value: string) => {
        const normalizedValue = value.toUpperCase();
        setCustomHex(normalizedValue);

        if (normalizedValue.length === 6 && /^[0-9A-F]{6}$/.test(normalizedValue)) {
            const fullHex = `#${normalizedValue}`;
            setAccentColor(fullHex);
        }
    };

    const handleColorPickerChange = (value: string) => {
        setAccentColor(value);
        setCustomHex(value.substring(1));
    };

    const isPresetSelected = PRESET_COLORS.some(color => color.value === accentColor);
    const displayHex = accentColor.startsWith("#") ? accentColor.substring(1) : "";

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Preset Colors */}
            <div className="flex items-center gap-3">
                {PRESET_COLORS.map((color) => (
                    <button
                        key={color.name}
                        type="button"
                        className={`w-8 h-8 rounded-full transition-all ${
                            accentColor === color.value
                                ? "ring-2 ring-offset-2 ring-offset-background"
                                : ""
                        }`}
                        style={{
                            backgroundColor: color.value,
                            borderColor: accentColor === color.value ? color.value : "transparent",
                            boxShadow: accentColor === color.value ? `0 0 0 2px ${color.value}` : "none",
                        }}
                        onClick={() => handlePresetColorClick(color.value)}
                        aria-label={color.name}
                    />
                ))}
            </div>

            {/* Custom Color Input */}
            <div className="flex items-center gap-3">
                <span className="text-muted-foreground text-sm">Custom Color</span>

                <div className="relative flex items-center">
                    <span className="left-3 absolute text-foreground">#</span>
                    <Input
                        value={customHex || displayHex}
                        onChange={(e) => handleHexInputChange(e.target.value)}
                        className="pl-7 w-24 font-mono text-sm uppercase"
                        placeholder="4146F8"
                        maxLength={6}
                    />
                </div>

                {/* Color Picker */}
                <div className="relative">
                    <input
                        type="color"
                        value={accentColor.startsWith("#") ? accentColor : "#4146F8"}
                        onChange={(e) => handleColorPickerChange(e.target.value)}
                        className="absolute inset-0 opacity-0 rounded-full w-full h-full cursor-pointer"
                        aria-label="Custom color picker"
                    />
                    <div
                        className="rounded-full ring-2 ring-offset-2 ring-offset-background w-8 h-8 cursor-pointer"
                        style={{
                            backgroundColor: accentColor.startsWith("#") ? accentColor : "#4146F8",
                            boxShadow: `0 0 0 2px ${accentColor.startsWith("#") ? accentColor : "#4146F8"}`,
                        }}
                    />
                </div>
            </div>
        </div>
    );
}