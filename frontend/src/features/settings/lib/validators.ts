import {z} from "zod";

// Reusable schema for common provider fields
const aiProviderBaseSchema = z.object({
    enabled: z.boolean(),
    apiKey: z.string().optional(),
    model: z.string().optional(),
});

export const aiSettingsSchema = z.object({
    ollama: aiProviderBaseSchema.extend({
        enabled: z.boolean(),
        // Make URL required if Ollama is enabled
        url: z.string().optional(),
        model: z.string().optional(),
    }).refine(data => !data.enabled || (data.enabled && typeof data.url === 'string' && data.url.trim() !== ''), {
        message: "Ollama URL is required when enabled.",
        path: ["url"], // Specify the path for the error message
    }),
    openai: aiProviderBaseSchema.extend({
        enabled: z.boolean(),
        // Make API key required if OpenAI is enabled
        apiKey: z.string().optional(),
        model: z.string().optional(),
    }).refine(data => !data.enabled || (data.enabled && typeof data.apiKey === 'string' && data.apiKey.trim() !== ''), {
        message: "OpenAI API Key is required when enabled.",
        path: ["apiKey"],
    }),
    google: aiProviderBaseSchema.extend({
        enabled: z.boolean(),
        // Make API key required if Google is enabled
        apiKey: z.string().optional(),
        model: z.string().optional(),
    }).refine(data => !data.enabled || (data.enabled && typeof data.apiKey === 'string' && data.apiKey.trim() !== ''), {
        message: "Google API Key is required when enabled.",
        path: ["apiKey"],
    }),
    anthropic: aiProviderBaseSchema.extend({
        enabled: z.boolean(),
        // Make API key required if Anthropic is enabled
        apiKey: z.string().optional(),
        model: z.string().optional(),
    }).refine(data => !data.enabled || (data.enabled && typeof data.apiKey === 'string' && data.apiKey.trim() !== ''), {
        message: "Anthropic API Key is required when enabled.",
        path: ["apiKey"],
    }),
    // Add global AI settings
    temperature: z.number()
        .min(0, {message: "Temperature must be at least 0."})
        .max(2, {message: "Temperature must be at most 2."})
        .optional(),
    systemPrompt: z.string().optional(),
});

export type AISettingsSchema = z.infer<typeof aiSettingsSchema>; 