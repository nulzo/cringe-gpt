/**
 * Utility functions for color manipulation and validation
 */

export interface RGB {
    r: number;
    g: number;
    b: number;
}

/**
 * Extracts lightness value from OKLCH color string
 */
export const getOklchLightness = (oklchString: string): number | null => {
    const match = oklchString.match(/oklch\(\s*([\d.]+)/);
    return match ? parseFloat(match[1]) : null;
};

/**
 * Converts hex color to RGB
 */
export const hexToRgb = (hex: string): RGB | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        }
        : null;
};

/**
 * Calculates relative luminance for accessibility
 */
export const getRelativeLuminance = (rgb: RGB): number => {
    const RsRGB = rgb.r / 255;
    const GsRGB = rgb.g / 255;
    const BsRGB = rgb.b / 255;

    const R =
        RsRGB <= 0.03928 ? RsRGB / 12.92 : Math.pow((RsRGB + 0.055) / 1.055, 2.4);
    const G =
        GsRGB <= 0.03928 ? GsRGB / 12.92 : Math.pow((GsRGB + 0.055) / 1.055, 2.4);
    const B =
        BsRGB <= 0.03928 ? BsRGB / 12.92 : Math.pow((BsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
};

/**
 * Determines if a color is light or dark for contrast calculation
 */
export const isLightColor = (colorValue: string): boolean => {
    const oklchL = getOklchLightness(colorValue);

    if (oklchL !== null) {
        return oklchL > 0.6;
    }

    if (colorValue.startsWith("#")) {
        const rgb = hexToRgb(colorValue);
        if (rgb) {
            return getRelativeLuminance(rgb) > 0.4;
        }
    }

    return false;
};

/**
 * Validates if a string is a valid hex color
 */
export const isValidHexColor = (hex: string): boolean => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
};

/**
 * Normalizes hex color to 6-digit format
 */
export const normalizeHexColor = (hex: string): string => {
    if (!hex.startsWith("#")) {
        hex = "#" + hex;
    }

    // Convert 3-digit hex to 6-digit
    if (hex.length === 4) {
        hex = "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }

    return hex.toUpperCase();
};