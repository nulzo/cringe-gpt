import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Button } from "@/components/ui/button.tsx";
import HotkeySettingsSection from "@/features/settings/components/sections/hotkey-settings-section.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Input } from "@/components/ui/input.tsx";
import { useEffect, useMemo, useState } from "react";
import {
  IconAccessible,
  IconBell,
  IconClock,
  IconCpu,
  IconCreditCard,
  IconDeviceDesktop,
  IconDeviceFloppy,
  IconKeyboard,
  IconLanguage,
  IconMoon,
  IconPalette,
  IconShieldCheck,
  IconSun,
  IconUser,
  IconChevronRight,
} from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { useSettings } from "@/features/settings/api/get-settings.ts";
import { useUpdateSettings } from "@/features/settings/api/update-settings.ts";
import { useAnimationStore } from "@/stores/animation-store.ts";
import { useTheme } from "@/shared/ui/theme.tsx";
import { useProviderSettings } from "@/features/settings/api/get-provider-settings.ts";
import { useUpdateProviderSettings } from "@/features/settings/api/update-provider-settings.ts";
import { useProviders } from "@/features/settings/api/get-providers.ts";
import { type ProviderType } from "@/features/chat/types";
import { type ProviderSettings as ProviderSettingsType } from "@/features/settings/api/get-provider-settings.ts";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useModelsByProvider } from "@/features/models/api/get-models-by-provider";
import { ProviderIconFromKey } from "@/components/ui/provider-icon";
// Note: Implement sections inline in this original file (no external sections)

// Sidebar sections grouped for a cleaner, ChatGPT-like navigation
const primarySections = [
  { id: "appearance", label: "Appearance", icon: IconPalette },
  { id: "ai", label: "AI Providers", icon: IconCpu },
  { id: "language", label: "Language", icon: IconLanguage },
  { id: "datetime", label: "Date & Time", icon: IconClock },
  { id: "shortcuts", label: "Shortcuts", icon: IconKeyboard },
] as const;

const secondarySections = [
  { id: "account", label: "Account", icon: IconUser },
  { id: "plans", label: "Plans & upgrades", icon: IconCreditCard },
  { id: "privacy", label: "Privacy", icon: IconShieldCheck },
  { id: "notifications", label: "Notification", icon: IconBell },
  { id: "accessibility", label: "Accessibility", icon: IconAccessible },
] as const;

const presetColors = [
  { name: "Default", value: "oklch(0.645 0.246 16.439)" }, // Primary
  { name: "Zinc", value: "oklch(0.58 0.018 286)" },
  { name: "Rose", value: "oklch(0.65 0.19 13)" },
  { name: "Green", value: "oklch(0.65 0.17 145)" },
  { name: "Blue", value: "oklch(0.6 0.18 250)" },
  { name: "Violet", value: "oklch(0.6 0.19 285)" },
];

const ACCENT_STORAGE_KEY = "app-accent-color";

const getOklchLightness = (oklchString: string): number | null => {
  const match = oklchString.match(/oklch\(\s*([\d.]+)/);
  return match ? parseFloat(match[1]) : null;
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

const getRelativeLuminance = (rgb: {
  r: number;
  g: number;
  b: number;
}): number => {
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

const applyAccentColor = (colorValue: string) => {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  // --- Set the BASE variables ---
  root.style.setProperty("--primary", colorValue);
  root.style.setProperty("--ring", colorValue);
  // ------------------------------

  // Determine appropriate foreground color
  let primaryLightness = 0.5;
  const oklchL = getOklchLightness(colorValue);

  if (oklchL !== null) {
    primaryLightness = oklchL;
  } else if (colorValue.startsWith("#")) {
    const rgb = hexToRgb(colorValue);
    if (rgb) {
      primaryLightness = getRelativeLuminance(rgb) > 0.4 ? 1 : 0;
    }
  }

  const foregroundColor =
    primaryLightness > 0.6
      ? "oklch(0.14 0.005 285)" // Dark fg approx
      : "oklch(1 0 0)"; // Light fg approx

  root.style.setProperty("--primary-foreground", foregroundColor);
};

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState("appearance");
  const { data: settings } = useSettings();
  const { mutate: updateSettings } = useUpdateSettings();

  const animationsEnabled = useAnimationStore((s) => s.animationsEnabled);
  const toggleAnimations = useAnimationStore((s) => s.toggleAnimations);

  const { setTheme, theme } = useTheme();

  // Providers list and selected provider state
  const { data: providers = [], isLoading: isLoadingProviders } =
    useProviders();
  const queryClient = useQueryClient();
  const [selectedProvider, setSelectedProvider] = useState<
    ProviderType | undefined
  >(undefined);
  const initialProvider = useMemo<ProviderType | undefined>(() => {
    if (!providers || providers.length === 0) return undefined;
    // Prefer OpenAi if available, else first provider from backend
    if (providers.includes("OpenAi" as ProviderType)) return "OpenAi";
    return providers[0] as ProviderType;
  }, [providers, settings?.settings?.preferredModel]);
  useEffect(() => {
    if (!selectedProvider && initialProvider)
      setSelectedProvider(initialProvider);
  }, [selectedProvider, initialProvider]);

  const { data: providerSettings, isLoading: isLoadingProviderSettings } =
    useProviderSettings(selectedProvider as ProviderType);
  const { mutate: saveProviderSettings, isPending: isSavingProvider } =
    useUpdateProviderSettings(selectedProvider as ProviderType);
  const [apiUrl, setApiUrl] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [defaultModel, setDefaultModel] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const providerMeta: Partial<
    Record<
      ProviderType,
      {
        label: string;
        description: string;
        urlPlaceholder: string;
        modelPlaceholder: string;
        docUrl: string;
      }
    >
  > = {
    OpenAi: {
      label: "OpenAI",
      description: "Use OpenAI models such as GPT-4o, GPT-4o-mini, and more.",
      urlPlaceholder: "https://api.openai.com/v1",
      modelPlaceholder: "gpt-4o-mini, gpt-4o, o3-mini",
      docUrl: "https://platform.openai.com/docs",
    },
    Ollama: {
      label: "Ollama",
      description:
        "Run local models with Ollama. Ensure your Ollama daemon is running.",
      urlPlaceholder: "http://localhost:11434",
      modelPlaceholder: "llama3, mistral, qwen2",
      docUrl: "https://github.com/ollama/ollama",
    },
    Anthropic: {
      label: "Anthropic",
      description:
        "Use Claude models for high-quality reasoning and assistance.",
      urlPlaceholder: "https://api.anthropic.com",
      modelPlaceholder: "claude-3-5-sonnet, claude-3-opus",
      docUrl: "https://docs.anthropic.com",
    },
    Google: {
      label: "Google",
      description: "Use Google Gemini models for text and multimodal tasks.",
      urlPlaceholder: "https://generativelanguage.googleapis.com",
      modelPlaceholder: "gemini-1.5-pro, gemini-1.5-flash",
      docUrl: "https://ai.google.dev/gemini-api",
    },
    OpenRouter: {
      label: "OpenRouter",
      description: "Access multiple providers via a unified OpenRouter API.",
      urlPlaceholder: "https://openrouter.ai/api/v1",
      modelPlaceholder: "openrouter/*, meta-llama/*",
      docUrl: "https://openrouter.ai/docs",
    },
  };
  useEffect(() => {
    // Prefetch all providers' settings so sidebar can show configured status consistently
    if (providers && providers.length > 0) {
      providers.forEach((p) => {
        queryClient.prefetchQuery({
          queryKey: ["providerSettings", p],
          queryFn: () => api.get(`/providers/me/credentials/${p}`),
          staleTime: 5 * 60 * 1000,
        });
      });
    }
  }, [providers, queryClient]);

  useEffect(() => {
    if (providerSettings) {
      setApiUrl(providerSettings.apiUrl ?? "");
      setApiKey(providerSettings.apiKey ?? "");
      setDefaultModel(providerSettings.defaultModel ?? "");
    } else {
      setApiUrl("");
      setApiKey("");
      setDefaultModel("");
    }
  }, [providerSettings, selectedProvider]);

  // Sync selected provider when navigating via sidebar sections
  useEffect(() => {
    if (activeSection.startsWith("provider:")) {
      const p = activeSection.split(":")[1] as ProviderType | undefined;
      if (p && p !== selectedProvider) setSelectedProvider(p);
    }
  }, [activeSection]);

  const { data: modelsForProvider = [] } =
    useModelsByProvider(selectedProvider);

  const [currentAccent, setCurrentAccent] = useState<string>(() => {
    if (typeof window === "undefined") return presetColors[0].value;
    const storedAccent = localStorage.getItem(ACCENT_STORAGE_KEY);
    if (storedAccent) return storedAccent;
    // --- Initialize from BASE --primary variable ---
    const computed = getComputedStyle(document.documentElement)
      .getPropertyValue("--primary")
      .trim();
    if (computed) return computed;
    // -------------------------------------------
    return presetColors[0].value;
  });

  // Apply initial/stored accent color on mount
  useEffect(() => {
    applyAccentColor(currentAccent);
  }, []);

  // Handle color change and save to localStorage
  const handleAccentChange = (colorValue: string) => {
    setCurrentAccent(colorValue);
    applyAccentColor(colorValue);
    localStorage.setItem(ACCENT_STORAGE_KEY, colorValue);
  };

  const handleThemeChange = (t: "light" | "dark" | "system") => {
    // Persist to backend and sync UI theme locally
    try {
      updateSettings({ settings: { theme: t } });
    } catch {}
    setTheme(t);
  };

  const handleSaveProvider = () => {
    if (!selectedProvider) return;
    saveProviderSettings(
      {
        apiKey: apiKey || undefined,
        apiUrl: apiUrl || undefined,
        defaultModel: defaultModel || undefined,
      },
      {
        onSuccess: () => toast.success(`${selectedProvider} settings saved`),
        onError: () =>
          toast.error(`Failed to save ${selectedProvider} settings`),
      }
    );
  };
  const handleResetProvider = () => {
    setApiUrl(providerSettings?.apiUrl ?? "");
    setApiKey(providerSettings?.apiKey ?? "");
    setDefaultModel(providerSettings?.defaultModel ?? "");
  };
  const handleClearProvider = () => {
    if (!selectedProvider) return;
    saveProviderSettings(
      { apiKey: "", apiUrl: "", defaultModel: "" },
      {
        onSuccess: () => {
          toast.success(`${selectedProvider} settings cleared`);
          setApiUrl("");
          setApiKey("");
          setDefaultModel("");
        },
        onError: () =>
          toast.error(`Failed to clear ${selectedProvider} settings`),
      }
    );
  };
  const isConfigured = (s?: {
    apiKey?: string;
    apiUrl?: string;
    defaultModel?: string;
  }): boolean => {
    if (!s) return false;
    return Boolean(
      (s.apiKey && s.apiKey.trim()) ||
        (s.apiUrl && s.apiUrl.trim()) ||
        (s.defaultModel && s.defaultModel.trim())
    );
  };
  const configuredByProvider = useMemo<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    (providers || []).forEach((p) => {
      const cached = queryClient.getQueryData<ProviderSettingsType>([
        "providerSettings",
        p,
      ]);
      map[p] = isConfigured(cached);
    });
    return map;
  }, [providers, queryClient, providerSettings, apiUrl, apiKey, defaultModel]);
  const isDirty = useMemo(() => {
    return (
      (apiUrl || "") !== (providerSettings?.apiUrl || "") ||
      (apiKey || "") !== (providerSettings?.apiKey || "") ||
      (defaultModel || "") !== (providerSettings?.defaultModel || "")
    );
  }, [apiUrl, apiKey, defaultModel, providerSettings]);

  // Build ChatGPT-like sidebar with each provider under an "AI Providers" header
  const providerSections = useMemo(() => {
    return (providers || []).map((p) => ({
      id: `provider:${p}`,
      label: providerMeta[p]?.label ?? p,
    }));
  }, [providers]);

  const renderSectionContent = () => {
    switch (activeSection) {
      case "appearance":
        return (
          <div className="space-y-4">
            <h3 className="mb-2 font-medium text-lg">Appearance</h3>
            <p className="mb-6 text-muted-foreground text-sm">
              Choose your style or customize your theme.
            </p>
            <div className="space-y-2">
              <h4 className="font-medium">Theme</h4>
              <p className="text-muted-foreground text-sm">
                Select the theme for the dashboard.
              </p>
              <RadioGroup
                value={theme}
                onValueChange={(value: "light" | "dark" | "system") =>
                  handleThemeChange(value)
                }
                className="gap-4 grid grid-cols-3 pt-2"
              >
                <Label className="flex flex-col justify-center items-center p-4 border rounded-md [&:has([data-state=checked])]:ring-2 [&:has([data-state=checked])]:ring-primary cursor-pointer">
                  <RadioGroupItem
                    value="light"
                    id="light"
                    className="sr-only"
                  />
                  <IconSun className="mb-2 w-6 h-6" />
                  <span>Light</span>
                </Label>
                <Label className="flex flex-col justify-center items-center p-4 border rounded-md [&:has([data-state=checked])]:ring-2 [&:has([data-state=checked])]:ring-primary cursor-pointer">
                  <RadioGroupItem value="dark" id="dark" className="sr-only" />
                  <IconMoon className="mb-2 w-6 h-6" />
                  <span>Dark</span>
                </Label>
                <Label className="flex flex-col justify-center items-center p-4 border rounded-md [&:has([data-state=checked])]:ring-2 [&:has([data-state=checked])]:ring-primary cursor-pointer">
                  <RadioGroupItem
                    value="system"
                    id="system"
                    className="sr-only"
                  />
                  <IconDeviceDesktop className="mb-2 w-6 h-6" />
                  <span>System</span>
                </Label>
              </RadioGroup>
            </div>
            <Separator />
            <div className="mb-8">
              <h3 className="mb-2 font-medium text-lg">Accent Colors</h3>
              <p className="mb-4 text-muted-foreground text-sm">
                Use system or custom accent colors.
              </p>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {presetColors.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      className={`w-8 h-8 rounded-full transition-all ${
                        currentAccent === color.value
                          ? "ring-2 ring-offset-2 ring-offset-background"
                          : ""
                      }`}
                      style={{
                        backgroundColor: color.value,
                        // Add ring color based on the accent color itself for the selected item
                        borderColor:
                          currentAccent === color.value
                            ? color.value
                            : "transparent",
                        boxShadow:
                          currentAccent === color.value
                            ? `0 0 0 2px ${color.value}`
                            : "none",
                      }}
                      onClick={() => handleAccentChange(color.value)}
                      aria-label={color.name}
                    />
                  ))}
                </div>

                {/* Custom Color Input - always visible */}
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground text-sm">
                    Custom Color
                  </span>
                  <div className="relative flex items-center">
                    <span className="left-3 absolute text-foreground">#</span>
                    <Input
                      value={(currentAccent.startsWith("#")
                        ? currentAccent.substring(1)
                        : "4146F8"
                      ).toUpperCase()}
                      onChange={(e) => {
                        const hex = e.target.value.toUpperCase();
                        if (/^[0-9A-F]{0,6}$/.test(hex)) {
                          handleAccentChange(`#${hex}`);
                        }
                      }}
                      className="pl-7 w-24 font-mono text-sm uppercase"
                    />
                  </div>
                  {/* Color preview dot with color picker */}
                  <div className="relative">
                    <input
                      type="color"
                      value={
                        currentAccent.startsWith("#")
                          ? currentAccent
                          : "#4146F8"
                      }
                      onChange={(e) => handleAccentChange(e.target.value)}
                      className="absolute inset-0 opacity-0 rounded-full w-full h-full cursor-pointer"
                      aria-label="Custom color picker"
                    />
                    <div
                      className={`w-8 h-8 rounded-full ring-2 ring-offset-2 ring-offset-background cursor-pointer`}
                      style={{
                        backgroundColor: currentAccent.startsWith("#")
                          ? currentAccent
                          : "oklch(0.6 0.18 250)",
                        boxShadow: `0 0 0 2px ${
                          currentAccent.startsWith("#")
                            ? currentAccent
                            : "oklch(0.6 0.18 250)"
                        }`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-medium text-lg">Accent</h3>
                <p className="text-muted-foreground text-sm">
                  The speed of animations
                </p>
              </div>
              <Select>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Select a speed" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Animation Speeds</SelectLabel>
                    <SelectItem value="orange">Orange</SelectItem>
                    <SelectItem value="red">Red</SelectItem>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <Separator className="my-6" />

            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-medium text-lg">Show Animations</h3>
                <p className="text-muted-foreground text-sm">
                  Enable or disable UI animations
                </p>
              </div>
              <Switch
                checked={animationsEnabled}
                onCheckedChange={toggleAnimations}
              />
            </div>

            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-medium text-lg">Animation Speed</h3>
                <p className="text-muted-foreground text-sm">
                  The speed of animations
                </p>
              </div>
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a speed" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Animation Speeds</SelectLabel>
                    <SelectItem value="apple">Fastest</SelectItem>
                    <SelectItem value="banana">Fast</SelectItem>
                    <SelectItem value="blueberry">Normal</SelectItem>
                    <SelectItem value="grapes">Slow</SelectItem>
                    <SelectItem value="pineapple">Slowest</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <Separator className="my-6" />

            <div className="mb-6">
              <h3 className="mb-2 font-medium text-lg">Tables View</h3>
              <p className="mb-4 text-muted-foreground text-sm">
                Customize how tables are displayed in your app
              </p>
              <div className="gap-6 grid grid-cols-2">
                {/* Table Option 1 */}
                <div
                  className={`border-2 rounded-lg overflow-hidden ${"border-primary"}`}
                >
                  <div className="flex justify-between items-center bg-muted/20 p-2 border-b">
                    <span className="font-medium text-xs">Table View</span>
                    <div className="flex gap-1">
                      <div className="bg-muted rounded w-4 h-2"></div>
                      <div className="bg-muted rounded w-4 h-2"></div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="space-y-3">
                      <div className="bg-muted rounded w-full h-3"></div>
                      <div className="bg-muted rounded w-full h-3"></div>
                      <div className="bg-muted rounded w-full h-3"></div>
                      <div className="bg-muted rounded w-full h-3"></div>
                    </div>
                  </div>
                </div>

                {/* Table Option 2 */}
                <div
                  className={`border-2 rounded-lg overflow-hidden ${"border-muted"}`}
                >
                  <div className="flex justify-between items-center bg-muted/20 p-2 border-b">
                    <span className="font-medium text-xs">Table View</span>
                    <div className="flex gap-1">
                      <div className="bg-muted rounded w-4 h-2"></div>
                      <div className="bg-muted rounded w-4 h-2"></div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="space-y-3">
                      <div className="bg-muted rounded w-full h-3"></div>
                      <div className="bg-muted rounded w-full h-3"></div>
                      <div className="bg-muted rounded w-full h-3"></div>
                      <div className="bg-muted rounded w-full h-3"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case "ai":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-xl">AI Providers</h3>
              <p className="mt-1 text-muted-foreground text-sm">
                Minimal setup for each provider. Keep only what's necessary.
              </p>
            </div>

            <div className="space-y-6">
              {/* Provider tabs */}
              {isLoadingProviders ? (
                <div className="flex gap-2">
                  <div className="bg-muted/40 rounded-lg h-9 w-24 animate-pulse" />
                  <div className="bg-muted/40 rounded-lg h-9 w-24 animate-pulse" />
                  <div className="bg-muted/40 rounded-lg h-9 w-24 animate-pulse" />
                </div>
              ) : providers && providers.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {providers.map((p) => {
                    const configured = configuredByProvider[p] ?? false;
                    const active = selectedProvider === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setSelectedProvider(p)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-medium text-sm transition-all ${
                          active
                            ? "bg-secondary border-border shadow-sm"
                            : "hover:bg-muted/50 border-transparent"
                        }`}
                      >
                        <span>{providerMeta[p]?.label ?? p}</span>
                        {configured && (
                          <span className="bg-emerald-500/20 px-1.5 py-0.5 rounded text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            Configured
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">
                  No providers available.
                </div>
              )}

              {/* Provider configuration */}
              {!selectedProvider ? (
                <div className="flex justify-center items-center py-12 text-muted-foreground text-sm">
                  Select a provider to configure
                </div>
              ) : isLoadingProviderSettings ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="bg-muted/40 rounded h-5 w-32 animate-pulse" />
                    <div className="bg-muted/40 rounded h-4 w-48 animate-pulse" />
                  </div>
                  <div className="space-y-4">
                    <div className="bg-muted/40 rounded-lg h-10 animate-pulse" />
                    <div className="bg-muted/40 rounded-lg h-10 animate-pulse" />
                    <div className="bg-muted/40 rounded-lg h-10 animate-pulse" />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Provider header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-lg">
                        {providerMeta[selectedProvider]?.label ??
                          selectedProvider}
                      </h4>
                      <p className="mt-0.5 text-muted-foreground text-sm">
                        {providerMeta[selectedProvider]?.description ??
                          "Configure credentials and defaults."}
                      </p>
                    </div>
                    {providerMeta[selectedProvider]?.docUrl && (
                      <a
                        className="text-primary hover:underline text-sm font-medium"
                        href={providerMeta[selectedProvider]!.docUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Docs
                      </a>
                    )}
                  </div>

                  <Separator />

                  {/* Connection section */}
                  <div className="space-y-4">
                    <h5 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Connection
                    </h5>
                    <div className="gap-4 grid grid-cols-2">
                      <div className="space-y-2">
                        <Label
                          htmlFor="api-url"
                          className="text-sm font-medium"
                        >
                          API URL
                        </Label>
                        <Input
                          id="api-url"
                          value={apiUrl}
                          onChange={(e) => setApiUrl(e.target.value)}
                          placeholder={
                            providerMeta[selectedProvider]?.urlPlaceholder ??
                            "https://..."
                          }
                          disabled={!selectedProvider || isSavingProvider}
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="default-model"
                          className="text-sm font-medium"
                        >
                          Default Model
                        </Label>
                        <Select
                          value={defaultModel}
                          onValueChange={setDefaultModel}
                        >
                          <SelectTrigger id="default-model" className="h-10">
                            <SelectValue
                              placeholder={
                                providerMeta[selectedProvider]
                                  ?.modelPlaceholder ?? "model-id"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Models</SelectLabel>
                              {(modelsForProvider || []).map((m) => (
                                <SelectItem key={m.id} value={m.name}>
                                  {m.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Credentials section */}
                  <div className="space-y-4">
                    <h5 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Credentials
                    </h5>
                    <div className="space-y-2">
                      <Label htmlFor="api-key" className="text-sm font-medium">
                        API Key
                      </Label>
                      <div className="relative">
                        <Input
                          id="api-key"
                          type={showApiKey ? "text" : "password"}
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="sk-..."
                          disabled={!selectedProvider || isSavingProvider}
                          className="pr-16 h-10"
                        />
                        <button
                          type="button"
                          className="top-1/2 right-3 absolute text-xs text-muted-foreground hover:text-foreground font-medium -translate-y-1/2 transition-colors"
                          onClick={() => setShowApiKey((v) => !v)}
                        >
                          {showApiKey ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <Separator />
                </div>
              )}
            </div>
          </div>
        );
      case "account":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-xl">Account</h3>
              <p className="mt-1 text-muted-foreground text-sm">
                Manage your profile and preferences.
              </p>
            </div>

            <div className="space-y-4">
              <h5 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Profile
              </h5>
              <div className="gap-4 grid grid-cols-2">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={settings?.email ?? ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={settings?.name ?? ""} disabled />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h5 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Preferences
              </h5>
              <div className="gap-4 grid grid-cols-2">
                <div className="space-y-2">
                  <Label>Preferred Model</Label>
                  <Input
                    placeholder="model-id"
                    value={settings?.settings?.preferredModel ?? ""}
                    onChange={(e) =>
                      updateSettings({
                        settings: {
                          preferredModel: e.target.value || undefined,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select value={theme} onValueChange={handleThemeChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h5 className="text-xs font-semibold tracking-wide text-destructive uppercase">
                Danger Zone
              </h5>
              <div className="flex justify-between items-center border p-3 rounded-md">
                <div>
                  <div className="font-medium">Delete Account</div>
                  <div className="text-muted-foreground text-sm">
                    Permanently remove your account and all associated data.
                  </div>
                </div>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (
                      !confirm(
                        "Are you sure you want to permanently delete your account? This action cannot be undone."
                      )
                    )
                      return;
                    try {
                      await api.delete("/users/me");
                      toast.success("Your account has been deleted");
                      // Force logout by clearing token and reloading
                      try {
                        localStorage.removeItem("token");
                      } catch {}
                      window.location.href = "/";
                    } catch {
                      toast.error("Failed to delete account");
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        );
      case "shortcuts":
        return (
          <div className="space-y-4">
            <h3 className="mb-2 font-medium text-lg">Keyboard Shortcuts</h3>
            <HotkeySettingsSection />
          </div>
        );
      default:
        if (activeSection.startsWith("provider:")) {
          const provider = activeSection.split(":")[1] as
            | ProviderType
            | undefined;
          return (
            <div className="space-y-6">
              {/* Mirror the AI Providers configuration for a single provider view */}
              {isLoadingProviderSettings ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="bg-muted/40 rounded h-5 w-32 animate-pulse" />
                    <div className="bg-muted/40 rounded h-4 w-48 animate-pulse" />
                  </div>
                  <div className="space-y-4">
                    <div className="bg-muted/40 rounded-lg h-10 animate-pulse" />
                    <div className="bg-muted/40 rounded-lg h-10 animate-pulse" />
                    <div className="bg-muted/40 rounded-lg h-10 animate-pulse" />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-lg">
                        {provider
                          ? providerMeta[provider]?.label ?? provider
                          : "Provider"}
                      </h4>
                      <p className="mt-0.5 text-muted-foreground text-sm">
                        {provider
                          ? providerMeta[provider]?.description ??
                            "Configure credentials and defaults."
                          : ""}
                      </p>
                    </div>
                    {provider && providerMeta[provider]?.docUrl && (
                      <a
                        className="text-primary hover:underline text-sm font-medium"
                        href={providerMeta[provider]!.docUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Docs
                      </a>
                    )}
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <h5 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Connection
                    </h5>
                    <div className="gap-4 grid grid-cols-2">
                      <div className="space-y-2">
                        <Label
                          htmlFor="api-url"
                          className="text-sm font-medium"
                        >
                          API URL
                        </Label>
                        <Input
                          id="api-url"
                          value={apiUrl}
                          onChange={(e) => setApiUrl(e.target.value)}
                          placeholder={
                            provider
                              ? providerMeta[provider]?.urlPlaceholder ??
                                "https://..."
                              : "https://..."
                          }
                          disabled={!provider || isSavingProvider}
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="default-model"
                          className="text-sm font-medium"
                        >
                          Default Model
                        </Label>
                        <Select
                          value={defaultModel}
                          onValueChange={setDefaultModel}
                        >
                          <SelectTrigger id="default-model" className="h-10">
                            <SelectValue
                              placeholder={
                                provider
                                  ? providerMeta[provider]?.modelPlaceholder ??
                                    "model-id"
                                  : "model-id"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Models</SelectLabel>
                              {(modelsForProvider || []).map((m) => (
                                <SelectItem key={m.id} value={m.name}>
                                  {m.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h5 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Credentials
                    </h5>
                    <div className="space-y-2">
                      <Label htmlFor="api-key" className="text-sm font-medium">
                        API Key
                      </Label>
                      <div className="relative">
                        <Input
                          id="api-key"
                          type={showApiKey ? "text" : "password"}
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="sk-..."
                          disabled={!provider || isSavingProvider}
                          className="pr-16 h-10"
                        />
                        <button
                          type="button"
                          className="top-1/2 right-3 absolute text-xs text-muted-foreground hover:text-foreground font-medium -translate-y-1/2 transition-colors"
                          onClick={() => setShowApiKey((v) => !v)}
                        >
                          {showApiKey ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>
                  </div>
                  <Separator />
                </div>
              )}
            </div>
          );
        }
        return <div>Select a section</div>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex gap-0 p-0 max-w-3xl h-[70vh] overflow-hidden">
        <div className="flex flex-col flex-shrink-0  py-2  px-2 border-r w-50 bg-sidebar min-h-0">
          <DialogHeader className="mb-2 sticky top-0 mt-2 pl-2 bg-sidebar z-10 pb-2">
            <DialogTitle className="text-base">Settings</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            <nav className="flex flex-col space-y-1">
              {primarySections.map((section) => {
                const Icon = section.icon;
                return (
                  <Button
                    key={section.id}
                    variant={
                      activeSection === section.id ? "secondary" : "ghost"
                    }
                    className="justify-between gap-2 h-9"
                    onClick={() => setActiveSection(section.id)}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icon className="size-5 text-foreground/90" />
                      {section.label}
                    </span>
                  </Button>
                );
              })}
              <Separator className="my-3" />
              {!!providerSections.length && (
                <>
                  <div className="px-2 mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Providers
                  </div>
                  {providerSections.map((section) => {
                    const key = section.id.split(":")[1];
                    return (
                      <Button
                        key={section.id}
                        variant={
                          activeSection === section.id ? "secondary" : "ghost"
                        }
                        className="justify-between gap-2 h-9"
                        onClick={() => setActiveSection(section.id)}
                      >
                        <span className="inline-flex items-center gap-2">
                          <ProviderIconFromKey
                            providerKey={key}
                            size={18}
                            className="rounded"
                          />
                          {section.label}
                        </span>
                      </Button>
                    );
                  })}
                  <Separator className="my-3" />
                </>
              )}
              <div className="px-2 mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                More
              </div>
              {secondarySections.map((section) => {
                const Icon = section.icon;
                return (
                  <Button
                    key={section.id}
                    variant={
                      activeSection === section.id ? "secondary" : "ghost"
                    }
                    className="justify-between gap-2 h-9"
                    onClick={() => setActiveSection(section.id)}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icon className="size-5 text-foreground/90" />
                      {section.label}
                    </span>
                  </Button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 p-6 overflow-y-auto">
            {renderSectionContent()}
          </div>
          {(activeSection === "ai" || activeSection.startsWith("provider:")) &&
            !!selectedProvider &&
            isDirty && (
              <div className="px-6 py-3 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={handleResetProvider}
                    disabled={isSavingProvider}
                  >
                    Reset
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleClearProvider}
                    disabled={!selectedProvider || isSavingProvider}
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={handleSaveProvider}
                    disabled={!selectedProvider || isSavingProvider}
                  >
                    {isSavingProvider ? (
                      <>
                        <IconDeviceFloppy className="mr-2 w-4 h-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <IconDeviceFloppy className="mr-2 w-4 h-4" />
                        Save changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
