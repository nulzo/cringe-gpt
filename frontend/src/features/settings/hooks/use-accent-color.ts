import { useEffect } from "react";
import { useAccentColorStore } from "@/stores/theme-store";
import { isLightColor } from "@/utils/color-utils";

/**
 * Hook to manage accent color application to the DOM
 */
export const useAccentColor = () => {
    const accentColor = useAccentColorStore((state) => state.accentColor);

    useEffect(() => {
        if (typeof document === "undefined") return;

        const root = document.documentElement;

        // Apply primary color
        root.style.setProperty("--primary", accentColor);
        root.style.setProperty("--ring", accentColor);

        // Calculate and apply foreground color for contrast
        const isLight = isLightColor(accentColor);
        const foregroundColor = isLight
            ? "oklch(0.14 0.005 285)"
            : "oklch(1 0 0)";

        root.style.setProperty("--primary-foreground", foregroundColor);
    }, [accentColor]);

    return accentColor;
};