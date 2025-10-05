using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Enums;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Services.Pricing;

/// <summary>
/// Google AI pricing service with comprehensive model pricing
/// </summary>
public class GooglePricingService : IProviderPricingService
{
    public ProviderType ProviderType => ProviderType.Google;

    // Google Gemini pricing as of latest documentation
    private static readonly Dictionary<string, ModelPricingDto> StaticPricing =
        new(StringComparer.OrdinalIgnoreCase)
        {
            // Gemini 1.5 Pro (latest)
            ["gemini-1.5-pro"] = new ModelPricingDto
            {
                PromptCostPerMillionTokens = 1.25m,
                CompletionCostPerMillionTokens = 5.00m,
                CachedInputCostPerMillionTokens = 0.3125m, // 25% of input cost for cached
                Notes = "Gemini 1.5 Pro - Context length up to 2M tokens",
                LastUpdated = DateTimeOffset.UtcNow,
                IsDynamic = false
            },

            // Gemini 1.5 Pro with 128K context
            ["gemini-1.5-pro-128k"] = new ModelPricingDto
            {
                PromptCostPerMillionTokens = 1.25m,
                CompletionCostPerMillionTokens = 5.00m,
                CachedInputCostPerMillionTokens = 0.3125m,
                Notes = "Gemini 1.5 Pro with 128K context window",
                LastUpdated = DateTimeOffset.UtcNow,
                IsDynamic = false
            },

            // Gemini 1.5 Flash (latest)
            ["gemini-1.5-flash"] = new ModelPricingDto
            {
                PromptCostPerMillionTokens = 0.075m,
                CompletionCostPerMillionTokens = 0.30m,
                CachedInputCostPerMillionTokens = 0.01875m, // 25% of input cost for cached
                Notes = "Gemini 1.5 Flash - Fast and cost-effective",
                LastUpdated = DateTimeOffset.UtcNow,
                IsDynamic = false
            },

            // Gemini 1.5 Flash with 128K context
            ["gemini-1.5-flash-128k"] = new ModelPricingDto
            {
                PromptCostPerMillionTokens = 0.075m,
                CompletionCostPerMillionTokens = 0.30m,
                CachedInputCostPerMillionTokens = 0.01875m,
                Notes = "Gemini 1.5 Flash with 128K context window",
                LastUpdated = DateTimeOffset.UtcNow,
                IsDynamic = false
            },

            // Gemini 1.5 Flash-8B
            ["gemini-1.5-flash-8b"] = new ModelPricingDto
            {
                PromptCostPerMillionTokens = 0.0375m,
                CompletionCostPerMillionTokens = 0.15m,
                CachedInputCostPerMillionTokens = 0.009375m,
                Notes = "Gemini 1.5 Flash-8B - Most cost-effective option",
                LastUpdated = DateTimeOffset.UtcNow,
                IsDynamic = false
            },

            // Gemini 1.0 Pro (legacy)
            ["gemini-1.0-pro"] = new ModelPricingDto
            {
                PromptCostPerMillionTokens = 0.125m,
                CompletionCostPerMillionTokens = 0.375m,
                Notes = "Gemini 1.0 Pro - Legacy model",
                LastUpdated = DateTimeOffset.UtcNow,
                IsDynamic = false
            },

            // Gemini 1.0 Pro Vision
            ["gemini-1.0-pro-vision"] = new ModelPricingDto
            {
                PromptCostPerMillionTokens = 0.125m,
                CompletionCostPerMillionTokens = 0.375m,
                ImageInputCostPerMillionTokens = 0.125m, // Same as text input for vision models
                Notes = "Gemini 1.0 Pro Vision - Image understanding capabilities",
                LastUpdated = DateTimeOffset.UtcNow,
                IsDynamic = false
            },

            // Gemini Ultra (if available)
            ["gemini-ultra"] = new ModelPricingDto
            {
                PromptCostPerMillionTokens = 5.00m,
                CompletionCostPerMillionTokens = 15.00m,
                CachedInputCostPerMillionTokens = 1.25m,
                Notes = "Gemini Ultra - Most capable model (limited availability)",
                LastUpdated = DateTimeOffset.UtcNow,
                IsDynamic = false
            },

            // PaLM 2 models (legacy, might still be available)
            ["text-bison"] = new ModelPricingDto
            {
                PromptCostPerMillionTokens = 0.125m,
                CompletionCostPerMillionTokens = 0.125m,
                Notes = "PaLM 2 Text Bison - Legacy model",
                LastUpdated = DateTimeOffset.UtcNow,
                IsDynamic = false
            },

            ["chat-bison"] = new ModelPricingDto
            {
                PromptCostPerMillionTokens = 0.125m,
                CompletionCostPerMillionTokens = 0.125m,
                Notes = "PaLM 2 Chat Bison - Legacy model",
                LastUpdated = DateTimeOffset.UtcNow,
                IsDynamic = false
            }
        };

    private Dictionary<string, ModelPricingDto>? _cachedPricing;
    private DateTimeOffset _lastRefresh = DateTimeOffset.MinValue;
    private readonly TimeSpan _cacheDuration = TimeSpan.FromHours(24);

    public Task<ModelPricingDto?> GetModelPricingAsync(string modelId)
    {
        var allPricing = GetAllModelPricingAsync().Result;
        return Task.FromResult(allPricing.TryGetValue(modelId, out var pricing) ? pricing : null);
    }

    public Task<Dictionary<string, ModelPricingDto>> GetAllModelPricingAsync()
    {
        // Use cached pricing if it's still fresh
        if (_cachedPricing != null && DateTimeOffset.UtcNow - _lastRefresh < _cacheDuration)
        {
            return Task.FromResult(_cachedPricing);
        }

        // For now, we use static pricing since Google doesn't provide a dynamic pricing API
        // Structure is ready for future dynamic pricing implementation
        _cachedPricing = new Dictionary<string, ModelPricingDto>(StaticPricing, StringComparer.OrdinalIgnoreCase);
        _lastRefresh = DateTimeOffset.UtcNow;

        return Task.FromResult(_cachedPricing);
    }

    public ModelToolingDto GetModelTooling(string modelId)
    {
        var tooling = new ModelToolingDto();

        if (modelId.Contains("gemini-1.5-pro"))
        {
            tooling.SupportsChat = true;
            tooling.SupportsVision = true;
            tooling.SupportsTools = true;
            tooling.SupportsFunctionCalling = true;
            tooling.SupportsStructuredOutputs = true;
            tooling.SupportsStreaming = true;
            tooling.PerformanceTier = "High-Quality";
            tooling.UseCase = "Advanced multimodal capabilities";
        }
        else if (modelId.Contains("gemini-1.0-pro"))
        {
            tooling.SupportsChat = true;
            tooling.SupportsTools = true;
            tooling.SupportsFunctionCalling = true;
            tooling.SupportsStructuredOutputs = true;
            tooling.SupportsStreaming = true;
            tooling.PerformanceTier = "Balanced";
            tooling.UseCase = "General purpose text generation";
        }

        var modalities = new List<string>();
        if (tooling.SupportsChat) modalities.Add("text");
        if (tooling.SupportsVision) modalities.Add("image");
        tooling.SupportedModalities = modalities.Any() ? modalities : null;

        return tooling;
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
        // Static pricing doesn't need refreshing, but we reset cache to ensure fresh data
        _cachedPricing = null;
        _lastRefresh = DateTimeOffset.MinValue;
        return Task.FromResult(false);
    }

    /// <summary>
    /// Gets pricing for models with context window considerations
    /// Google charges different rates for different context windows
    /// </summary>
    public static ModelPricingDto GetPricingForModelWithContext(string modelId, int contextLength)
    {
        if (StaticPricing.TryGetValue(modelId, out var basePricing))
        {
            // For models with larger context windows, pricing might differ
            // This is a placeholder for more complex pricing logic
            if (contextLength > 1000000) // 1M+ tokens
            {
                // Could implement tiered pricing here if Google introduces it
                return basePricing;
            }

            return basePricing;
        }

        return ModelPricingDto.Free("Model pricing not found");
    }
}
