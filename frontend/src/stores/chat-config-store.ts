// chat-config-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ProviderType =
  | "Ollama"
  | "OpenAi"
  | "Anthropic"
  | "OpenRouter"
  | "Google";

interface ChatConfig {
  selectedModelId: string | null;
  selectedProvider: ProviderType | null;
  temperature: number;
  topP: number;
  topK: number;
  maxTokens: number | null;
  systemPrompt: string;
  isTemporary: boolean;
  activePersonaId: number | null;
  activePersonaName: string | null;
  activePromptId: number | null;
  activePromptTitle: string | null;
  promptVariables: Record<string, string>;
}

interface ChatConfigActions {
  setSelectedModel: (modelId: string, provider: ProviderType) => void;
  setTemperature: (temperature: number) => void;
  setTopP: (topP: number) => void;
  setTopK: (topK: number) => void;
  setMaxTokens: (maxTokens: number | null) => void;
  setSystemPrompt: (prompt: string) => void;
  setIsTemporary: (isTemporary: boolean) => void;
  setActivePersona: (id: number | null, name: string | null) => void;
  clearPersona: () => void;
  setActivePrompt: (id: number | null, title: string | null) => void;
  clearPrompt: () => void;
  setPromptVariables: (vars: Record<string, string>) => void;
  resetConfig: () => void;
}

interface ChatConfigStore extends ChatConfig, ChatConfigActions {}

export const defaultChatConfig: ChatConfig = {
  selectedModelId: null,
  selectedProvider: null,
  temperature: 0.7,
  topP: 0.9,
  topK: 0.4,
  maxTokens: null,
  systemPrompt: "",
  isTemporary: false,
  activePersonaId: null,
  activePersonaName: null,
  activePromptId: null,
  activePromptTitle: null,
  promptVariables: {},
};

export const useChatConfigStore = create<ChatConfigStore>()(
  persist(
    (set) => ({
      ...defaultChatConfig,
      setSelectedModel: (modelId, provider) =>
        set({ selectedModelId: modelId, selectedProvider: provider }),
      setTemperature: (temperature) => set({ temperature }),
      setTopP: (topP) => set({ topP }),
      setTopK: (topK) => set({ topK }),
      setMaxTokens: (maxTokens) => set({ maxTokens }),
      setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),
      setIsTemporary: (isTemporary) => set({ isTemporary }),
      setActivePersona: (id, name) =>
        set({ activePersonaId: id, activePersonaName: name }),
      clearPersona: () =>
        set({ activePersonaId: null, activePersonaName: null }),
      setActivePrompt: (id, title) =>
        set({ activePromptId: id, activePromptTitle: title }),
      clearPrompt: () =>
        set({
          activePromptId: null,
          activePromptTitle: null,
          promptVariables: {},
        }),
      setPromptVariables: (vars) => set({ promptVariables: vars }),
      resetConfig: () =>
        set((state) => ({
          ...state,
          temperature: defaultChatConfig.temperature,
          topP: defaultChatConfig.topP,
          topK: defaultChatConfig.topK,
          systemPrompt: defaultChatConfig.systemPrompt,
          maxTokens: defaultChatConfig.maxTokens,
          isTemporary: defaultChatConfig.isTemporary,
          activePersonaId: defaultChatConfig.activePersonaId,
          activePersonaName: defaultChatConfig.activePersonaName,
          activePromptId: defaultChatConfig.activePromptId,
          activePromptTitle: defaultChatConfig.activePromptTitle,
          promptVariables: defaultChatConfig.promptVariables,
        })),
    }),
    {
      name: "chat-config-storage",
      partialize: (state) => ({
        selectedModelId: state.selectedModelId,
        selectedProvider: state.selectedProvider,
        temperature: state.temperature,
        topP: state.topP,
        topK: state.topK,
        maxTokens: state.maxTokens,
        systemPrompt: state.systemPrompt,
        isTemporary: state.isTemporary,
        activePersonaId: state.activePersonaId,
        activePersonaName: state.activePersonaName,
        activePromptId: state.activePromptId,
        activePromptTitle: state.activePromptTitle,
        promptVariables: state.promptVariables,
      }),
    },
  ),
);
