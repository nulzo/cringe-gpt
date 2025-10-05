// chat-config-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ProviderType = 'Ollama' | 'OpenAi' | 'Anthropic' | 'OpenRouter' | 'Google';

interface ChatConfig {
    selectedModelId: string | null;
    selectedProvider: ProviderType | null;
    temperature: number;
    topP: number;
    topK: number;
    maxTokens: number | null;
    systemPrompt: string;
    isTemporary: boolean;
}

interface ChatConfigActions {
    setSelectedModel: (modelId: string, provider: ProviderType) => void;
    setTemperature: (temperature: number) => void;
    setTopP: (topP: number) => void;
    setTopK: (topK: number) => void;
    setMaxTokens: (maxTokens: number | null) => void;
    setSystemPrompt: (prompt: string) => void;
    setIsTemporary: (isTemporary: boolean) => void;
    resetConfig: () => void;
}

interface ChatConfigStore extends ChatConfig, ChatConfigActions { }

export const defaultChatConfig: ChatConfig = {
    selectedModelId: null,
    selectedProvider: null,
    temperature: 0.7,
    topP: 0.9,
    topK: 0.4,
    maxTokens: null,
    systemPrompt: '',
    isTemporary: false,
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
            resetConfig: () =>
                set((state) => ({
                    ...state,
                    temperature: defaultChatConfig.temperature,
                    topP: defaultChatConfig.topP,
                    topK: defaultChatConfig.topK,
                    systemPrompt: defaultChatConfig.systemPrompt,
                    maxTokens: defaultChatConfig.maxTokens,
                    isTemporary: defaultChatConfig.isTemporary,
                })),
        }),
        {
            name: 'chat-config-storage',
            partialize: (state) => ({
                selectedModelId: state.selectedModelId,
                selectedProvider: state.selectedProvider,
                temperature: state.temperature,
                topP: state.topP,
                topK: state.topK,
                maxTokens: state.maxTokens,
                systemPrompt: state.systemPrompt,
                isTemporary: state.isTemporary,
            }),
        }
    )
);
