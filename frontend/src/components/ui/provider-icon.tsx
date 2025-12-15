import { useLayoutEffect, useMemo, useRef, useState } from "react";
import * as Icons from "@lobehub/icons";
import { cn } from "@/lib/utils";
import { type ModelResponse } from "@/types/api";

// (Keep your helper functions: providerNameExceptions, getProviderKeyFromModel, getIconName)
const providerNameExceptions: Record<string, string> = {
  "01-ai": "ZeroOne",
  "meta-llama": "Meta",
  "google-gemini": "Google",
  ai21: "Ai21",
  amazon: "Aws",
  mistralai: "Mistral",
  moonshotai: "Moonshot",
  nousresearch: "Nous",
  openai: "OpenAI",
  perplexity: "Perplexity",
  qwen: "Qwen",
  together: "Together",
  nvidia: "Nvidia",
  "moonshot ai": "Moonshot",
  nous: "NousResearch",
  openrouter: "OpenRouter",
  "x-ai": "XAI",
  "aion-labs": "AionLabs",
  deepseek: "DeepSeek",
  "gpt-image-1": "OpenAI",
};

export const getProviderKeyFromModel = (model: ModelResponse): string => {
  if (model.id && model.id.includes("/")) {
    return model.id.split("/")[0].toLowerCase();
  }
  if (model.provider) {
    return model.provider.toLowerCase();
  }
  return "ollama";
};

export const getIconName = (providerKey: string): string => {
  const mappedName = providerNameExceptions[providerKey];
  if (mappedName) return mappedName;
  return (
    providerKey.charAt(0).toUpperCase() +
    providerKey.slice(1).replace(/[^a-zA-Z0-9]/g, "")
  );
};

const getRgbFromColorString = ((): ((
  colorString: string,
) => [number, number, number] | null) => {
  if (typeof document === "undefined") {
    return () => null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  return (colorString: string): [number, number, number] | null => {
    if (!ctx || !colorString) return null;

    ctx.fillStyle = colorString;
    ctx.fillRect(0, 0, 1, 1);

    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return [r, g, b];
  };
})();

const getLuminance = (r: number, g: number, b: number): number => {
  return 0.299 * r + 0.587 * g + 0.114 * b;
};

const areColorsSimilar = (
  colorA: string,
  colorB: string,
  threshold: number = 30,
): boolean => {
  const rgbA = getRgbFromColorString(colorA);
  const rgbB = getRgbFromColorString(colorB);
  if (!rgbA || !rgbB) return false;
  const lumA = getLuminance(...rgbA);
  const lumB = getLuminance(...rgbB);
  return Math.abs(lumA - lumB) < threshold;
};

export function ProviderIcon({
  model,
  className,
  size = 16,
}: {
  model: ModelResponse;
  className?: string;
  size?: number;
}) {
  const providerKey = getProviderKeyFromModel(model);
  const iconName = getIconName(providerKey);

  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldInvert, setShouldInvert] = useState(false);

  const { IconComponent, colorPrimary } = useMemo(() => {
    const BaseIcon = (Icons as any)[iconName];
    if (!BaseIcon) {
      return { IconComponent: null, colorPrimary: undefined };
    }
    const IconRef = BaseIcon.Icon || BaseIcon;
    return {
      IconComponent: IconRef,
      colorPrimary: BaseIcon.colorPrimary,
    };
  }, [iconName]);

  useLayoutEffect(() => {
    if (!containerRef.current || !IconComponent || !colorPrimary) {
      setShouldInvert(false);
      return;
    }

    const container = containerRef.current;

    const styles = window.getComputedStyle(container);

    const iconColor = styles.color;

    const backgroundColor = styles.backgroundColor;

    const isTransparent = backgroundColor === "rgba(0, 0, 0, 0)";

    if (!isTransparent && areColorsSimilar(iconColor, backgroundColor)) {
      setShouldInvert(true);
    } else {
      setShouldInvert(false);
    }
  }, [IconComponent, colorPrimary, size]);

  if (!IconComponent) {
    const fallbackInitial = (providerKey[0] || "").toUpperCase();
    return (
      <div
        className={cn(
          "flex items-center border bg-primary text-primary-foreground border-border rounded justify-center",
          className,
        )}
        style={{ width: size, height: size }}
      >
        <span className="text-sm font-semibold">{fallbackInitial}</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("flex items-center justify-center rounded", className)}
      style={{
        backgroundColor: colorPrimary,
        width: size,
        height: size,
      }}
    >
      <IconComponent
        color=""
        style={{
          width: size * 0.7,
          height: size * 0.7,
          filter: shouldInvert ? "invert(1)" : "none",
        }}
      />
    </div>
  );
}

export function ProviderIconFromKey({
  providerKey,
  className,
  size = 16,
}: {
  providerKey: string;
  className?: string;
  size?: number;
}) {
  const iconName = getIconName(providerKey.toLowerCase());

  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldInvert, setShouldInvert] = useState(false);

  const { IconComponent, colorPrimary } = useMemo(() => {
    const BaseIcon = (Icons as any)[iconName];
    if (!BaseIcon) {
      return { IconComponent: null, colorPrimary: undefined };
    }
    const IconRef = BaseIcon.Icon || BaseIcon;
    return {
      IconComponent: IconRef,
      colorPrimary: BaseIcon.colorPrimary,
    };
  }, [iconName]);

  useLayoutEffect(() => {
    if (!containerRef.current || !IconComponent || !colorPrimary) {
      setShouldInvert(false);
      return;
    }

    const container = containerRef.current;
    const styles = window.getComputedStyle(container);
    const iconColor = styles.color;
    const backgroundColor = styles.backgroundColor;
    const isTransparent = backgroundColor === "rgba(0, 0, 0, 0)";
    if (!isTransparent && areColorsSimilar(iconColor, backgroundColor)) {
      setShouldInvert(true);
    } else {
      setShouldInvert(false);
    }
  }, [IconComponent, colorPrimary, size]);

  if (!IconComponent) {
    const fallbackInitial = (providerKey[0] || "").toUpperCase();
    return (
      <div
        className={cn(
          "flex items-center border bg-primary text-primary-foreground border-border rounded justify-center",
          className,
        )}
        style={{ width: size, height: size }}
      >
        <span className="text-sm font-semibold">{fallbackInitial}</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("flex items-center justify-center rounded", className)}
      style={{
        backgroundColor: colorPrimary,
        width: size,
        height: size,
      }}
    >
      <IconComponent
        color=""
        style={{
          width: size * 0.7,
          height: size * 0.7,
          filter: shouldInvert ? "invert(1)" : "none",
        }}
      />
    </div>
  );
}
