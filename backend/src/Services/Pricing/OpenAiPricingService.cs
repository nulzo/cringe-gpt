using System;
using System.Collections.Generic;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Enums;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Services.Pricing;

/// <summary>
/// OpenAI pricing service using the comprehensive pricing dictionary
/// </summary>
public class OpenAiPricingService : IProviderPricingService
{
    public ProviderType ProviderType => ProviderType.OpenAi;
    // Units:
    // - InputPerM / OutputPerM / CachedInputPerM / TrainingPerM: USD per 1,000,000 tokens
    // - EmbeddingPer1K: USD per 1,000 tokens
    // - RFTTrainingPerHour: USD per training hour (reinforcement fine-tuning)
    // - Audio*/Image*: USD per 1,000,000 tokens (as listed for Realtime/Image APIs)
    private sealed record Pricing(
        decimal? InputPerM = null,
        decimal? OutputPerM = null,
        decimal? CachedInputPerM = null,
        decimal? TrainingPerM = null,
        decimal? RFTTrainingPerHour = null,
        decimal? AudioInputPerM = null,
        decimal? AudioOutputPerM = null,
        decimal? ImageInputPerM = null,
        decimal? ImageOutputPerM = null,
        decimal? ImageCachedInputPerM = null,
        decimal? EmbeddingPer1K = null,
        decimal? WebSearch = null,
        string? Notes = null
    );

    private static readonly IReadOnlyDictionary<string, Pricing> ModelsPricing =
        new Dictionary<string, Pricing>(StringComparer.OrdinalIgnoreCase)
        {
            // ========= GPT-5 Family (Standard Tier) =========
            ["gpt-5"] = new Pricing(
                InputPerM: 1.250m, CachedInputPerM: 0.125m, OutputPerM: 10.000m,
                Notes: "GPT-5 Standard tier pricing"),
            ["gpt-5-mini"] = new Pricing(
                InputPerM: 0.250m, CachedInputPerM: 0.025m, OutputPerM: 2.000m,
                Notes: "GPT-5 Mini Standard tier pricing"),
            ["gpt-5-nano"] = new Pricing(
                InputPerM: 0.050m, CachedInputPerM: 0.005m, OutputPerM: 0.400m,
                Notes: "GPT-5 Nano Standard tier pricing"),
            ["gpt-5-chat-latest"] = new Pricing(
                InputPerM: 1.250m, CachedInputPerM: 0.125m, OutputPerM: 10.000m,
                Notes: "GPT-5 Chat Latest Standard tier pricing"),

            // ========= GPT-4.1 Family (Standard Tier) =========
            ["gpt-4.1"] = new Pricing(
                InputPerM: 2.000m, CachedInputPerM: 0.500m, OutputPerM: 8.000m,
                Notes: "GPT-4.1 Standard tier pricing"),
            ["gpt-4.1-mini"] = new Pricing(
                InputPerM: 0.400m, CachedInputPerM: 0.100m, OutputPerM: 1.600m,
                Notes: "GPT-4.1 Mini Standard tier pricing"),
            ["gpt-4.1-nano"] = new Pricing(
                InputPerM: 0.100m, CachedInputPerM: 0.025m, OutputPerM: 0.400m,
                Notes: "GPT-4.1 Nano Standard tier pricing"),

            // ========= GPT-4o Family (Standard Tier) =========
            ["gpt-4o"] = new Pricing(
                InputPerM: 2.500m, CachedInputPerM: 1.250m, OutputPerM: 10.000m,
                Notes: "GPT-4o Standard tier pricing"),
            ["gpt-4o-2024-05-13"] = new Pricing(
                InputPerM: 5.000m, OutputPerM: 15.000m,
                Notes: "GPT-4o 2024-05-13 Standard tier pricing"),
            ["gpt-4o-mini"] = new Pricing(
                InputPerM: 0.150m, CachedInputPerM: 0.075m, OutputPerM: 0.600m,
                Notes: "GPT-4o Mini Standard tier pricing"),

            // ========= Realtime Models =========
            ["gpt-realtime"] = new Pricing(
                InputPerM: 4.000m, CachedInputPerM: 0.400m, OutputPerM: 16.000m,
                AudioInputPerM: 32.000m, AudioOutputPerM: 64.000m,
                ImageInputPerM: 5.000m, ImageCachedInputPerM: 0.400m,
                Notes: "Realtime API Standard tier pricing"),
            ["gpt-4o-realtime-preview"] = new Pricing(
                InputPerM: 5.000m, CachedInputPerM: 2.500m, OutputPerM: 20.000m,
                AudioInputPerM: 40.000m, AudioOutputPerM: 80.000m,
                Notes: "GPT-4o Realtime Preview Standard tier pricing"),
            ["gpt-4o-mini-realtime-preview"] = new Pricing(
                InputPerM: 0.600m, CachedInputPerM: 0.300m, OutputPerM: 2.400m,
                AudioInputPerM: 10.000m, AudioOutputPerM: 20.000m,
                Notes: "GPT-4o Mini Realtime Preview Standard tier pricing"),

            // ========= Audio Models =========
            ["gpt-audio"] = new Pricing(
                InputPerM: 2.500m, OutputPerM: 10.000m,
                AudioInputPerM: 40.000m,
                Notes: "GPT Audio Standard tier pricing"),
            ["gpt-4o-audio-preview"] = new Pricing(
                InputPerM: 2.500m, OutputPerM: 10.000m,
                AudioInputPerM: 40.000m, AudioOutputPerM: 80.000m,
                Notes: "GPT-4o Audio Preview Standard tier pricing"),
            ["gpt-4o-mini-audio-preview"] = new Pricing(
                InputPerM: 0.150m, OutputPerM: 0.600m,
                AudioInputPerM: 10.000m, AudioOutputPerM: 20.000m,
                Notes: "GPT-4o Mini Audio Preview Standard tier pricing"),
            ["gpt-4o-mini-tts"] = new Pricing(
                InputPerM: 0.600m, AudioOutputPerM: 12.000m,
                Notes: "GPT-4o Mini TTS Standard tier pricing"),
            ["gpt-4o-transcribe"] = new Pricing(
                InputPerM: 2.500m, OutputPerM: 10.000m,
                AudioInputPerM: 6.000m,
                Notes: "GPT-4o Transcribe Standard tier pricing"),
            ["gpt-4o-mini-transcribe"] = new Pricing(
                InputPerM: 1.250m, OutputPerM: 5.000m,
                AudioInputPerM: 3.000m,
                Notes: "GPT-4o Mini Transcribe Standard tier pricing"),

            // ========= O-Series Models =========
            ["o1"] = new Pricing(
                InputPerM: 15.000m, CachedInputPerM: 7.500m, OutputPerM: 60.000m,
                Notes: "O1 Standard tier pricing"),
            ["o1-pro"] = new Pricing(
                InputPerM: 150.000m, OutputPerM: 600.000m,
                Notes: "O1 Pro Standard tier pricing"),
            ["o1-mini"] = new Pricing(
                InputPerM: 1.100m, CachedInputPerM: 0.550m, OutputPerM: 4.400m,
                Notes: "O1 Mini Standard tier pricing"),
            ["o3"] = new Pricing(
                InputPerM: 2.000m, CachedInputPerM: 0.500m, OutputPerM: 8.000m,
                Notes: "O3 Standard tier pricing"),
            ["o3-pro"] = new Pricing(
                InputPerM: 20.000m, OutputPerM: 80.000m,
                Notes: "O3 Pro Standard tier pricing"),
            ["o3-deep-research"] = new Pricing(
                InputPerM: 10.000m, CachedInputPerM: 2.500m, OutputPerM: 40.000m,
                Notes: "O3 Deep Research Standard tier pricing"),
            ["o3-mini"] = new Pricing(
                InputPerM: 1.100m, CachedInputPerM: 0.550m, OutputPerM: 4.400m,
                Notes: "O3 Mini Standard tier pricing"),
            ["o4-mini"] = new Pricing(
                InputPerM: 1.100m, CachedInputPerM: 0.275m, OutputPerM: 4.400m,
                Notes: "O4 Mini Standard tier pricing"),
            ["o4-mini-deep-research"] = new Pricing(
                InputPerM: 2.000m, CachedInputPerM: 0.500m, OutputPerM: 8.000m,
                Notes: "O4 Mini Deep Research Standard tier pricing"),

            // ========= Image Generation =========
            ["gpt-image-1"] = new Pricing(
                InputPerM: 5.000m, CachedInputPerM: 1.250m,
                ImageInputPerM: 10.000m, ImageCachedInputPerM: 2.500m, ImageOutputPerM: 40.000m,
                Notes: "GPT Image 1 - Image outputs cost $0.011-$0.25 depending on quality/size"),

            // ========= Search Preview Models =========
            ["gpt-4o-mini-search-preview"] = new Pricing(
                InputPerM: 0.150m, OutputPerM: 0.600m,
                WebSearch: 10.000m, // $10 per 1k calls
                Notes: "GPT-4o Mini Search Preview Standard tier pricing"),
            ["gpt-4o-search-preview"] = new Pricing(
                InputPerM: 2.500m, OutputPerM: 10.000m,
                WebSearch: 10.000m, // $10 per 1k calls
                Notes: "GPT-4o Search Preview Standard tier pricing"),

            // ========= Computer Use =========
            ["computer-use-preview"] = new Pricing(
                InputPerM: 3.000m, OutputPerM: 12.000m,
                Notes: "Computer Use Preview Standard tier pricing"),

            // ========= Fine-tuning Models =========
            ["gpt-4.1-2025-04-14"] = new Pricing(
                InputPerM: 3.000m, CachedInputPerM: 0.750m, OutputPerM: 12.000m, TrainingPerM: 25.000m,
                Notes: "GPT-4.1 Fine-tuning Standard tier pricing"),
            ["gpt-4.1-mini-2025-04-14"] = new Pricing(
                InputPerM: 0.800m, CachedInputPerM: 0.200m, OutputPerM: 3.200m, TrainingPerM: 5.000m,
                Notes: "GPT-4.1 Mini Fine-tuning Standard tier pricing"),
            ["gpt-4.1-nano-2025-04-14"] = new Pricing(
                InputPerM: 0.200m, CachedInputPerM: 0.050m, OutputPerM: 0.800m, TrainingPerM: 1.500m,
                Notes: "GPT-4.1 Nano Fine-tuning Standard tier pricing"),
            ["gpt-4o-2024-08-06"] = new Pricing(
                InputPerM: 3.750m, CachedInputPerM: 1.875m, OutputPerM: 15.000m, TrainingPerM: 25.000m,
                Notes: "GPT-4o Fine-tuning Standard tier pricing"),
            ["gpt-4o-mini-2024-07-18"] = new Pricing(
                InputPerM: 0.300m, CachedInputPerM: 0.150m, OutputPerM: 1.200m, TrainingPerM: 3.000m,
                Notes: "GPT-4o Mini Fine-tuning Standard tier pricing"),
            ["o4-mini-2025-04-16"] = new Pricing(
                InputPerM: 4.000m, CachedInputPerM: 1.000m, OutputPerM: 16.000m, RFTTrainingPerHour: 100.000m,
                Notes: "O4 Mini RFT Standard tier pricing"),

            // ========= Embeddings =========
            ["text-embedding-3-large"] = new Pricing(
                EmbeddingPer1K: 0.065m, Notes: "Text Embedding 3 Large Standard tier pricing"),
            ["text-embedding-3-small"] = new Pricing(
                EmbeddingPer1K: 0.010m, Notes: "Text Embedding 3 Small Standard tier pricing"),
            ["text-embedding-ada-002"] = new Pricing(
                EmbeddingPer1K: 0.050m, Notes: "Text Embedding Ada 002 Standard tier pricing"),

            // ========= Moderation =========
            ["omni-moderation-latest"] = new Pricing(
                InputPerM: 0m, OutputPerM: 0m, Notes: "Moderation is free"),

            // ========= Legacy Models =========
            ["gpt-4-turbo"] = new Pricing(
                InputPerM: 10.000m, OutputPerM: 30.000m,
                Notes: "GPT-4 Turbo Standard tier pricing"),
            ["gpt-4-turbo-2024-04-09"] = new Pricing(
                InputPerM: 10.000m, OutputPerM: 30.000m,
                Notes: "GPT-4 Turbo 2024-04-09 Standard tier pricing"),
            ["gpt-4-0125-preview"] = new Pricing(
                InputPerM: 10.000m, OutputPerM: 30.000m,
                Notes: "GPT-4 0125 Preview Standard tier pricing"),
            ["gpt-4-1106-preview"] = new Pricing(
                InputPerM: 10.000m, OutputPerM: 30.000m,
                Notes: "GPT-4 1106 Preview Standard tier pricing"),
            ["gpt-4-1106-vision-preview"] = new Pricing(
                InputPerM: 10.000m, OutputPerM: 30.000m,
                Notes: "GPT-4 1106 Vision Preview Standard tier pricing"),
            ["gpt-4-0613"] = new Pricing(
                InputPerM: 30.000m, OutputPerM: 60.000m,
                Notes: "GPT-4 0613 Standard tier pricing"),
            ["gpt-4-0314"] = new Pricing(
                InputPerM: 30.000m, OutputPerM: 60.000m,
                Notes: "GPT-4 0314 Standard tier pricing"),
            ["gpt-4-32k"] = new Pricing(
                InputPerM: 60.000m, OutputPerM: 120.000m,
                Notes: "GPT-4 32k Standard tier pricing"),
            ["gpt-3.5-turbo"] = new Pricing(
                InputPerM: 0.500m, OutputPerM: 1.500m,
                Notes: "GPT-3.5 Turbo Standard tier pricing"),
            ["gpt-3.5-turbo-0125"] = new Pricing(
                InputPerM: 0.500m, OutputPerM: 1.500m,
                Notes: "GPT-3.5 Turbo 0125 Standard tier pricing"),
            ["gpt-3.5-turbo-1106"] = new Pricing(
                InputPerM: 1.000m, OutputPerM: 2.000m,
                Notes: "GPT-3.5 Turbo 1106 Standard tier pricing"),
            ["gpt-3.5-turbo-0613"] = new Pricing(
                InputPerM: 1.500m, OutputPerM: 2.000m,
                Notes: "GPT-3.5 Turbo 0613 Standard tier pricing"),
            ["gpt-3.5-turbo-instruct"] = new Pricing(
                InputPerM: 1.500m, OutputPerM: 2.000m,
                Notes: "GPT-3.5 Turbo Instruct Standard tier pricing"),
            ["gpt-3.5-turbo-16k-0613"] = new Pricing(
                InputPerM: 3.000m, OutputPerM: 4.000m,
                Notes: "GPT-3.5 Turbo 16k 0613 Standard tier pricing"),
            ["davinci-002"] = new Pricing(
                InputPerM: 2.000m, OutputPerM: 2.000m,
                Notes: "Davinci 002 Standard tier pricing"),
            ["babbage-002"] = new Pricing(
                InputPerM: 0.400m, OutputPerM: 0.400m,
                Notes: "Babbage 002 Standard tier pricing"),
            ["chatgpt-4o-latest"] = new Pricing(
                InputPerM: 5.000m, OutputPerM: 15.000m,
                Notes: "ChatGPT-4o Latest Standard tier pricing"),

            // ========= Codex Models =========
            ["codex-mini-latest"] = new Pricing(
                InputPerM: 1.500m, CachedInputPerM: 0.375m, OutputPerM: 6.000m,
                Notes: "Codex Mini Latest Standard tier pricing")
        };

    public Task<ModelPricingDto?> GetModelPricingAsync(string modelId)
    {
        if (ModelsPricing.TryGetValue(modelId, out var pricing))
        {
            return Task.FromResult<ModelPricingDto?>(MapToModelPricingDto(modelId, pricing));
        }

        return Task.FromResult<ModelPricingDto?>(null);
    }

    public ModelToolingDto GetModelTooling(string modelId)
    {
        if (ModelsPricing.TryGetValue(modelId, out var pricing))
        {
            return MapToModelToolingDto(modelId, pricing);
        }

        return new ModelToolingDto(); // Return default empty tooling
    }

    public Task<Dictionary<string, ModelPricingDto>> GetAllModelPricingAsync()
    {
        var result = new Dictionary<string, ModelPricingDto>(StringComparer.OrdinalIgnoreCase);

        foreach (var (modelId, pricing) in ModelsPricing)
        {
            result[modelId] = MapToModelPricingDto(modelId, pricing);
        }

        return Task.FromResult(result);
    }

    public async Task<decimal> CalculateCostAsync(string modelId, int promptTokens, int completionTokens)
    {
        var pricing = await GetModelPricingAsync(modelId);
        if (pricing == null)
            return 0;

        return pricing.CalculateTotalCost(promptTokens, completionTokens);
    }

    public Task<bool> RefreshPricingAsync()
    {
        // Static pricing doesn't need refreshing
        return Task.FromResult(false);
    }

    private static ModelPricingDto MapToModelPricingDto(string modelId, Pricing pricing)
    {
        return new ModelPricingDto
        {
            PromptCostPerMillionTokens = pricing.InputPerM ?? 0,
            CompletionCostPerMillionTokens = pricing.OutputPerM ?? 0,
            CachedInputCostPerMillionTokens = pricing.CachedInputPerM,
            ImageInputCostPerMillionTokens = pricing.ImageInputPerM,
            ImageOutputCostPerMillionTokens = pricing.ImageOutputPerM,
            AudioInputCostPerMillionTokens = pricing.AudioInputPerM,
            AudioOutputCostPerMillionTokens = pricing.AudioOutputPerM,
            EmbeddingCostPerThousandTokens = pricing.EmbeddingPer1K,
            TrainingCostPerMillionTokens = pricing.TrainingPerM,
            TrainingCostPerHour = pricing.RFTTrainingPerHour,
            WebSearchCost = pricing.WebSearch,
            Notes = pricing.Notes,
            LastUpdated = DateTimeOffset.UtcNow,
            IsDynamic = false,
            Currency = "USD"
        };
    }

    private static ModelToolingDto MapToModelToolingDto(string modelId, Pricing pricing)
    {
        var tooling = new ModelToolingDto();
        var modelName = modelId.ToLower();

        // Set basic capabilities based on model type
        if (modelName.Contains("gpt-5"))
        {
            tooling.SupportsChat = true;
            tooling.SupportsTools = true;
            tooling.SupportsFunctionCalling = true;
            tooling.SupportsStructuredOutputs = true;
            tooling.SupportsStreaming = true;
            tooling.PerformanceTier = "High-Quality";
            tooling.UseCase = "Most advanced model capabilities";
        }
        else if (modelName.Contains("gpt-4.1"))
        {
            tooling.SupportsChat = true;
            tooling.SupportsTools = true;
            tooling.SupportsFunctionCalling = true;
            tooling.SupportsStructuredOutputs = true;
            tooling.SupportsStreaming = true;
            tooling.PerformanceTier = "High-Quality";
            tooling.UseCase = "Advanced multimodal capabilities";
        }
        else if (modelName.Contains("gpt-4o"))
        {
            tooling.SupportsChat = true;
            tooling.SupportsVision = true;
            tooling.SupportsTools = true;
            tooling.SupportsFunctionCalling = true;
            tooling.SupportsStructuredOutputs = true;
            tooling.SupportsStreaming = true;
            tooling.PerformanceTier = "High-Quality";
            tooling.UseCase = "General purpose with vision capabilities";
        }
        else if (modelName.Contains("gpt-4"))
        {
            tooling.SupportsChat = true;
            tooling.SupportsTools = true;
            tooling.SupportsFunctionCalling = true;
            tooling.SupportsStructuredOutputs = true;
            tooling.SupportsStreaming = true;
            tooling.PerformanceTier = "High-Quality";
            tooling.UseCase = "Advanced reasoning and analysis";
        }
        else if (modelName.Contains("o1") || modelName.Contains("o3") || modelName.Contains("o4"))
        {
            tooling.SupportsChat = true;
            tooling.SupportsTools = true;
            tooling.SupportsFunctionCalling = true;
            tooling.SupportsStructuredOutputs = true;
            tooling.SupportsStreaming = true;
            tooling.PerformanceTier = "High-Quality";
            tooling.UseCase = "Reasoning-optimized models";
        }
        else if (modelName.Contains("gpt-3.5"))
        {
            tooling.SupportsChat = true;
            tooling.SupportsStreaming = true;
            tooling.PerformanceTier = "Balanced";
            tooling.UseCase = "Fast and cost-effective conversations";
        }
        else if (modelName.Contains("realtime"))
        {
            tooling.SupportsChat = true;
            tooling.SupportsStreaming = true;
            tooling.SupportsRealtime = true;
            if (modelName.Contains("audio"))
            {
                tooling.SupportsAudio = true;
            }
            tooling.PerformanceTier = "Balanced";
            tooling.UseCase = "Real-time conversations and audio";
        }
        else if (modelName.Contains("dall-e") || modelName.Contains("gpt-image"))
        {
            tooling.SupportsImages = true;
            tooling.UseCase = "Image generation";
        }
        else if (modelName.Contains("text-embedding") || modelName.Contains("embedding"))
        {
            tooling.SupportsEmbeddings = true;
            tooling.UseCase = "Text embeddings for similarity search";
        }
        else if (modelName.Contains("audio") || modelName.Contains("tts") || modelName.Contains("transcribe"))
        {
            tooling.SupportsAudio = true;
            tooling.UseCase = "Audio processing and generation";
        }
        else if (modelName.Contains("computer-use"))
        {
            tooling.SupportsChat = true;
            tooling.SupportsTools = true;
            tooling.UseCase = "Computer interaction and automation";
        }
        else if (modelName.Contains("search-preview") || modelName.Contains("web"))
        {
            tooling.SupportsChat = true;
            tooling.SupportsWebSearch = true;
            tooling.UseCase = "Web search and information retrieval";
        }
        else if (modelName.Contains("codex"))
        {
            tooling.SupportsChat = true;
            tooling.SupportsCodeExecution = true;
            tooling.UseCase = "Code generation and analysis";
        }
        else if (modelName.Contains("moderation"))
        {
            tooling.UseCase = "Content moderation";
        }

        // Set supported modalities based on capabilities
        var modalities = new List<string>();
        if (tooling.SupportsChat || tooling.SupportsTools || tooling.SupportsFunctionCalling) modalities.Add("text");
        if (tooling.SupportsVision) modalities.Add("image");
        if (tooling.SupportsAudio) modalities.Add("audio");
        tooling.SupportedModalities = modalities.Any() ? modalities : null;

        return tooling;
    }
}
