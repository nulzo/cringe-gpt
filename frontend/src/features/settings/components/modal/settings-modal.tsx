import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Button } from "@/components/ui/button.tsx";
import HotkeySettingsSection from "@/features/settings/components/sections/hotkey-settings-section.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { useEffect, useMemo, useState } from "react";
import {
  IconBell,
  IconClock,
  IconDeviceFloppy,
  IconShieldCheck,
  IconUser,
  IconSettings,
  IconDatabase,
  IconUsers,
  IconLink,
  IconFileText,
  IconX,
  IconPlayerPlay,
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form.tsx";
import { useSettings } from "@/features/settings/api/get-settings.ts";
import { useUpdateSettings } from "@/features/settings/api/update-settings.ts";
import { useTheme } from "@/shared/ui/theme.tsx";
import { useProviderSettings } from "@/features/settings/api/get-provider-settings.ts";
import { useUpdateProviderSettings } from "@/features/settings/api/update-provider-settings.ts";
import { useProviders } from "@/features/settings/api/get-providers.ts";
import { type ProviderType } from "@/features/chat/types";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useModelsByProvider } from "@/features/models/api/get-models-by-provider";
import { ProviderIconFromKey } from "@/components/ui/provider-icon";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { IconDeviceDesktop, IconSun, IconMoon } from "@tabler/icons-react";

// Preset accent colors matching original component
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

// Zod schemas for form validation
const generalSettingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  accentColor: z.string().optional(),
  language: z.string().optional(),
  spokenLanguage: z.string().optional(),
  voice: z.string().optional(),
});

const personalizationSchema = z.object({
  enableCustomization: z.boolean(),
  personality: z.string().optional(),
  customInstructions: z.string().optional(),
  nickname: z.string().optional(),
  occupation: z.string().optional(),
  moreAboutYou: z.string().optional(),
});

const dataControlsSchema = z.object({
  improveModel: z.boolean(),
});

const primarySections = [
  { id: "general", label: "General", icon: IconSettings },
  { id: "notifications", label: "Notifications", icon: IconBell },
  { id: "personalization", label: "Personalization", icon: IconClock },
  { id: "connectors", label: "Connectors", icon: IconLink },
  { id: "orders", label: "Orders", icon: IconFileText },
  { id: "data-controls", label: "Data controls", icon: IconDatabase },
  { id: "security", label: "Security", icon: IconShieldCheck },
  { id: "parental-controls", label: "Parental controls", icon: IconUsers },
  { id: "account", label: "Account", icon: IconUser },
] as const;

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState("general");
  const { data: settings } = useSettings();
  const { mutate: updateSettings } = useUpdateSettings();

  const { setTheme, theme } = useTheme();

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
  const [accentSelection, setAccentSelection] = useState<string>(() => {
    const isPreset = presetColors.some((c) => c.value === currentAccent);
    return isPreset ? currentAccent : "custom";
  });

  // Apply initial/stored accent color on mount
  useEffect(() => {
    applyAccentColor(currentAccent);
  }, []);

  // Form instances for different sections
  const generalForm = useForm({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      theme: theme || "system",
      accentColor: currentAccent,
      language: "auto-detect",
      spokenLanguage: "auto-detect",
      voice: "maple",
    },
  });

  const personalizationForm = useForm({
    resolver: zodResolver(personalizationSchema),
    defaultValues: {
      enableCustomization: true,
      personality: "default",
      customInstructions: "",
      nickname: "",
      occupation: "",
      moreAboutYou: "",
    },
  });

  const dataControlsForm = useForm({
    resolver: zodResolver(dataControlsSchema),
    defaultValues: {
      improveModel: true,
    },
  });

  // Providers list and selected provider state
  const { data: providers = [] } = useProviders();
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

  const handleThemeChange = (t: "light" | "dark" | "system") => {
    // Persist to backend and sync UI theme locally
    try {
      updateSettings({ settings: { theme: t } });
    } catch {}
    setTheme(t);
  };

  // Handle color change and save to localStorage
  const handleAccentChange = (colorValue: string) => {
    setAccentSelection(colorValue);
    // When switching to custom, ensure we have a valid hex to edit
    if (colorValue === "custom") {
      const fallbackHex =
        currentAccent && currentAccent.startsWith("#")
          ? currentAccent
          : "#4146F8";
      setCurrentAccent(fallbackHex);
      applyAccentColor(fallbackHex);
      localStorage.setItem(ACCENT_STORAGE_KEY, fallbackHex);
      generalForm.setValue("accentColor", fallbackHex);
      return;
    }

    setCurrentAccent(colorValue);
    applyAccentColor(colorValue);
    localStorage.setItem(ACCENT_STORAGE_KEY, colorValue);
    generalForm.setValue("accentColor", colorValue);
  };

  // Handle custom color input changes
  const handleCustomColorChange = (colorValue: string) => {
    setAccentSelection("custom");
    setCurrentAccent(colorValue);
    applyAccentColor(colorValue);
    localStorage.setItem(ACCENT_STORAGE_KEY, colorValue);
    generalForm.setValue("accentColor", colorValue);
  };

  const handleLanguageChange = (value: string) => {
    generalForm.setValue("language", value);
    // Auto-save to localStorage
    localStorage.setItem("language", value);
  };

  const handleSpokenLanguageChange = (value: string) => {
    generalForm.setValue("spokenLanguage", value);
    // Auto-save to localStorage
    localStorage.setItem("spokenLanguage", value);
  };

  const handleVoiceChange = (value: string) => {
    generalForm.setValue("voice", value);
    // Auto-save to localStorage
    localStorage.setItem("voice", value);
  };

  // Form submission handlers (only for sections that need manual save)
  const onPersonalizationSubmit = (
    data: z.infer<typeof personalizationSchema>
  ) => {
    try {
      // Store personalization data in localStorage for now
      // In a real app, this would be sent to backend
      localStorage.setItem("personalization", JSON.stringify(data));
      toast.success("Personalization settings updated");
    } catch (error) {
      toast.error("Failed to update personalization settings");
    }
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
  const isDirty = useMemo(() => {
    return (
      (apiUrl || "") !== (providerSettings?.apiUrl || "") ||
      (apiKey || "") !== (providerSettings?.apiKey || "") ||
      (defaultModel || "") !== (providerSettings?.defaultModel || "")
    );
  }, [apiUrl, apiKey, defaultModel, providerSettings]);

  const providerSections = useMemo(() => {
    return (providers || []).map((p) => ({
      id: `provider:${p}`,
      label: providerMeta[p]?.label ?? p,
    }));
  }, [providers]);

  const renderSectionContent = () => {
    switch (activeSection) {
      case "general":
        return (
          <div className="space-y-8">
            <div>
              <h3 className="font-semibold text-xl">General</h3>
            </div>

            <div className="space-y-8">
              {/* Theme Selection */}
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <Label className="text-base">Theme</Label>
                </div>
                <Select value={theme} onValueChange={handleThemeChange}>
                  <SelectTrigger className="w-fit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Themes</SelectLabel>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">Light</div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">Dark</div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center gap-2">System</div>
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* Accent Color Selection */}
              <div className="space-y-4">
                <Label className="text-base">Accent color</Label>
                <div className="space-y-3">
                  <Select
                    value={accentSelection}
                    onValueChange={handleAccentChange}
                  >
                    <SelectTrigger className="w-fit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Accent Colors</SelectLabel>
                        {presetColors.map((color) => (
                          <SelectItem key={color.name} value={color.value}>
                            <div className="flex items-center gap-3">
                              <div
                                className="border border-border rounded-full size-2"
                                style={{ backgroundColor: color.value }}
                              />
                              {color.name}
                            </div>
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">
                          <div className="flex items-center gap-2">
                            <div className="bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 border border-border rounded-full size-2" />
                            Custom
                          </div>
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  {/* Custom Color Picker - Only show when custom is selected */}
                  {accentSelection === "custom" && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {["#4146F8","#F97316","#F43F5E","#0EA5E9","#22C55E","#EAB308","#8B5CF6","#0F172A"].map((swatch) => (
                          <button
                            key={swatch}
                            type="button"
                            aria-label={`Use color ${swatch}`}
                            onClick={() => handleCustomColorChange(swatch)}
                            className="size-8 rounded-full border border-border shadow-sm transition hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            style={{ backgroundColor: swatch }}
                          />
                        ))}
                      </div>

                      <div className="flex items-center gap-3 bg-muted/40 p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={currentAccent.startsWith("#") ? currentAccent : "#4146F8"}
                            onChange={(e) => handleCustomColorChange(e.target.value)}
                            className="size-10 rounded-md border border-border cursor-pointer bg-transparent p-0"
                            aria-label="Custom accent color"
                          />
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">Accent preview</span>
                            <div
                              className="h-2 w-16 rounded-full"
                              style={{ backgroundColor: currentAccent.startsWith("#") ? currentAccent : "#4146F8" }}
                            />
                          </div>
                        </div>

                        <div className="relative flex items-center">
                          <span className="left-3 absolute text-foreground/70 text-sm">#</span>
                          <Input
                            value={
                              currentAccent.startsWith("#")
                                ? currentAccent.substring(1).toUpperCase()
                                : "4146F8"
                            }
                            onChange={(e) => {
                              const hex = e.target.value.toUpperCase();
                              if (/^[0-9A-F]{0,6}$/.test(hex)) {
                                if (hex.length === 6) {
                                  handleCustomColorChange(`#${hex}`);
                                }
                              }
                            }}
                            maxLength={6}
                            className="pl-7 w-28 font-mono text-sm uppercase"
                            placeholder="4146F8"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Language Selection */}
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <Label className="text-base">Language</Label>
                </div>
                <Select
                  onValueChange={handleLanguageChange}
                  defaultValue="auto-detect"
                >
                  <SelectTrigger className="w-fit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto-detect">Auto-detect</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="it">Italian</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                    <SelectItem value="ru">Russian</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                    <SelectItem value="ko">Korean</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Spoken Language Selection */}
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <Label className="text-base">Spoken language</Label>
                  <p className="text-muted-foreground text-sm">
                    For best results, select the language you mainly speak. If
                    it's not listed, it may still be supported via
                    auto-detection.
                  </p>
                </div>
                <Select
                  onValueChange={handleSpokenLanguageChange}
                  defaultValue="auto-detect"
                >
                  <SelectTrigger className="w-fit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto-detect">Auto-detect</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="it">Italian</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                    <SelectItem value="ru">Russian</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                    <SelectItem value="ko">Korean</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Voice Selection */}
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <Label className="text-base">Voice</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon">
                    <IconPlayerPlay className="w-4 h-4" />
                  </Button>
                  <Select
                    onValueChange={handleVoiceChange}
                    defaultValue="maple"
                  >
                    <SelectTrigger className="w-fit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maple">Maple</SelectItem>
                      <SelectItem value="pine">Pine</SelectItem>
                      <SelectItem value="cedar">Cedar</SelectItem>
                      <SelectItem value="oak">Oak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        );

      case "personalization":
        return (
          <Form {...personalizationForm}>
            <form
              onSubmit={personalizationForm.handleSubmit(
                onPersonalizationSubmit
              )}
              className="space-y-6"
            >
              <div>
                <h3 className="font-semibold text-xl">Personalization</h3>
              </div>

              <div className="space-y-6">
                <FormField
                  control={personalizationForm.control}
                  name="enableCustomization"
                  render={({ field }) => (
                    <FormItem className="flex justify-between items-center">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Enable customization
                        </FormLabel>
                        <FormDescription className="text-muted-foreground text-sm">
                          Customize how CringeGPT responds to you.{" "}
                          <a href="#" className="text-blue-600 hover:underline">
                            Learn more
                          </a>
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={personalizationForm.control}
                  name="personality"
                  render={({ field }) => (
                    <FormItem className="flex justify-between items-center">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          CringeGPT personality
                        </FormLabel>
                        <FormDescription className="text-muted-foreground text-sm">
                          Set the style and tone CringeGPT uses when responding.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="w-fit">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Default</SelectItem>
                            <SelectItem value="chatty">Chatty</SelectItem>
                            <SelectItem value="witty">Witty</SelectItem>
                            <SelectItem value="straight-shooting">
                              Straight shooting
                            </SelectItem>
                            <SelectItem value="encouraging">
                              Encouraging
                            </SelectItem>
                            <SelectItem value="gen-z">Gen Z</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={personalizationForm.control}
                  name="customInstructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">
                        Custom instructions
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional behavior, style, and tone preferences"
                          className="min-h-24"
                          {...field}
                        />
                      </FormControl>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Button variant="outline" size="sm">
                          Chatty
                        </Button>
                        <Button variant="outline" size="sm">
                          Witty
                        </Button>
                        <Button variant="outline" size="sm">
                          Straight shooting
                        </Button>
                        <Button variant="outline" size="sm">
                          Encouraging
                        </Button>
                        <Button variant="outline" size="sm">
                          Gen Z
                        </Button>
                        <Button variant="outline" size="sm">
                          ...
                        </Button>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <h4 className="font-medium text-lg">About you</h4>

                  <FormField
                    control={personalizationForm.control}
                    name="nickname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Nickname</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="What should CringeGPT call you?"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={personalizationForm.control}
                    name="occupation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Occupation</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Engineering student at University of Waterloo"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div>
                    <h5 className="font-medium text-base">More about you</h5>
                    <FormField
                      control={personalizationForm.control}
                      name="moreAboutYou"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="Tell CringeGPT more about yourself..."
                              className="min-h-20"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={dataControlsForm.formState.isSubmitting}
                >
                  {dataControlsForm.formState.isSubmitting
                    ? "Saving..."
                    : "Save changes"}
                </Button>
              </div>
            </form>
          </Form>
        );

      case "data-controls":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-xl">Data controls</h3>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <Label className="text-base">
                    Improve the model for everyone
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">
                    {dataControlsForm.watch("improveModel") ? "On" : "Off"}
                  </span>
                  <Switch
                    checked={dataControlsForm.watch("improveModel")}
                    onCheckedChange={(checked) => {
                      dataControlsForm.setValue("improveModel", checked);
                      // Auto-save to localStorage
                      localStorage.setItem(
                        "dataControls",
                        JSON.stringify({ improveModel: checked })
                      );
                    }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <Label className="text-base">Shared links</Label>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </div>

                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <Label className="text-base">Archived chats</Label>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </div>

                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <Label className="text-base">Archive all chats</Label>
                  </div>
                  <Button variant="outline" size="sm">
                    Archive all
                  </Button>
                </div>

                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <Label className="text-base">Delete all chats</Label>
                  </div>
                  <Button variant="destructive" size="sm">
                    Delete all
                  </Button>
                </div>

                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <Label className="text-base">Export data</Label>
                  </div>
                  <Button variant="outline" size="sm">
                    Export
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-xl">Notifications</h3>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <Label className="text-base">Responses</Label>
                  <p className="text-muted-foreground text-sm">
                    Get notified when CringeGPT responds to requests that take
                    time, like research or image generation.
                  </p>
                </div>
                <Select defaultValue="push">
                  <SelectTrigger className="w-fit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="push">Push</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case "shortcuts":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-xl">Keyboard Shortcuts</h3>
            </div>
            <HotkeySettingsSection />
          </div>
        );

      case "account":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-xl">Account</h3>
            </div>

            <div className="space-y-4">
              <h5 className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
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
              <h5 className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
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
              <h5 className="font-semibold text-destructive text-xs uppercase tracking-wide">
                Danger Zone
              </h5>
              <div className="flex justify-between items-center p-3 border rounded-md">
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
                    <div className="bg-muted/40 rounded w-32 h-5 animate-pulse" />
                    <div className="bg-muted/40 rounded w-48 h-4 animate-pulse" />
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
                        className="font-medium text-primary text-sm hover:underline"
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
                    <h5 className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                      Connection
                    </h5>
                    <div className="gap-4 grid grid-cols-2">
                      <div className="space-y-2">
                        <Label
                          htmlFor="api-url"
                          className="font-medium text-sm"
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
                          className="font-medium text-sm"
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
                    <h5 className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                      Credentials
                    </h5>
                    <div className="space-y-2">
                      <Label htmlFor="api-key" className="font-medium text-sm">
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
                          className="top-1/2 right-3 absolute font-medium text-muted-foreground hover:text-foreground text-xs transition-colors -translate-y-1/2"
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
      <DialogContent className="flex p-0 rounded-2xl focus:outline-hidden w-full md:max-w-[680px] h-full md:h-[600px] max-md:min-h-[60vh] max-h-[85vh] overflow-hidden">
        <div className="flex flex-col flex-shrink-0 bg-sidebar px-2 py-4 border-r w-54 min-h-0">
          <DialogHeader className="top-0 z-10 sticky bg-sidebar pb-4">
            <div className="flex justify-between items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="p-0 w-8 h-8"
              >
                <IconX className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 -mr-2 pr-2 overflow-y-auto">
            <nav className="flex flex-col space-y-1">
              {primarySections.map((section) => {
                const Icon = section.icon;
                return (
                  <Button
                    key={section.id}
                    variant={
                      activeSection === section.id ? "secondary" : "ghost"
                    }
                    className="justify-start gap-3 px-3 h-10"
                    onClick={() => setActiveSection(section.id)}
                  >
                    <Icon className="size-4" />
                    {section.label}
                  </Button>
                );
              })}
              <Separator className="my-3" />
              {!!providerSections.length && (
                <>
                  <div className="mb-2 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                    AI Providers
                  </div>
                  {providerSections.map((section) => {
                    const key = section.id.split(":")[1];
                    return (
                      <Button
                        key={section.id}
                        variant={
                          activeSection === section.id ? "secondary" : "ghost"
                        }
                        className="justify-start gap-3 px-3 h-10"
                        onClick={() => setActiveSection(section.id)}
                      >
                        <ProviderIconFromKey
                          providerKey={key}
                          size={16}
                          className="rounded"
                        />
                        {section.label}
                      </Button>
                    );
                  })}
                </>
              )}
            </nav>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 p-8 overflow-y-auto">
            {renderSectionContent()}
          </div>
          {(activeSection === "ai" || activeSection.startsWith("provider:")) &&
            !!selectedProvider &&
            isDirty && (
              <div className="bg-background/80 supports-[backdrop-filter]:bg-background/60 backdrop-blur px-8 py-4 border-t">
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
