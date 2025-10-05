using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Enums;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Services.Pricing;

/// <summary>
/// OpenRouter pricing service that complements the existing API-based pricing
/// Provides fallback and enhanced pricing features
/// </summary>
public class OpenRouterPricingService : IProviderPricingService
{
    public ProviderType ProviderType => ProviderType.OpenRouter;

    private readonly ILogger<OpenRouterPricingService> _logger;

    // Fallback pricing for models that might not have pricing in API response
    private static readonly Dictionary<string, ModelPricingDto> FallbackPricing =
        new(StringComparer.OrdinalIgnoreCase)
        {
            // Default fallback
            ["default"] = ModelPricingDto.Create(0, 0, "OpenRouter model - pricing from API"),

            // Known model patterns for fallback pricing
            ["anthropic/claude"] = ModelPricingDto.Create(3.00m, 15.00m, "Anthropic via OpenRouter"),
            ["openai/gpt"] = ModelPricingDto.Create(2.50m, 10.00m, "OpenAI via OpenRouter"),
            ["google/gemini"] = ModelPricingDto.Create(1.25m, 5.00m, "Google via OpenRouter"),
            ["meta/llama"] = ModelPricingDto.Create(0, 0, "Meta Llama via OpenRouter"),
            ["mistralai/mistral"] = ModelPricingDto.Create(0, 0, "Mistral via OpenRouter"),

            // Specific model fallbacks
            ["anthropic/claude-3-5-sonnet"] = ModelPricingDto.Create(3.00m, 15.00m),
            ["openai/gpt-4o"] = ModelPricingDto.Create(5.00m, 15.00m),
            ["openai/gpt-4o-mini"] = ModelPricingDto.Create(0.15m, 0.60m),
            ["google/gemini-pro"] = ModelPricingDto.Create(1.25m, 5.00m),
            ["google/gemini-flash"] = ModelPricingDto.Create(0.075m, 0.30m),
        };

    public OpenRouterPricingService(ILogger<OpenRouterPricingService> logger)
    {
        _logger = logger;
    }

    public Task<ModelPricingDto?> GetModelPricingAsync(string modelId)
    {
        // For OpenRouter, pricing comes from their API response
        // This service provides fallbacks and enhanced features
        if (FallbackPricing.TryGetValue(modelId, out var pricing))
        {
            return Task.FromResult<ModelPricingDto?>(pricing);
        }

        // Try to match by provider prefix
        var providerPrefix = GetProviderPrefix(modelId);
        if (!string.IsNullOrEmpty(providerPrefix) && FallbackPricing.TryGetValue(providerPrefix, out pricing))
        {
            return Task.FromResult<ModelPricingDto?>(pricing);
        }

        // Return default fallback
        return Task.FromResult<ModelPricingDto?>(FallbackPricing["default"]);
    }

    public Task<Dictionary<string, ModelPricingDto>> GetAllModelPricingAsync()
    {
        // Return fallback pricing - actual pricing comes from OpenRouter API
        return Task.FromResult(new Dictionary<string, ModelPricingDto>(FallbackPricing, StringComparer.OrdinalIgnoreCase));
    }

    public ModelToolingDto GetModelTooling(string modelId)
    {
        var tooling = new ModelToolingDto();

        // OpenRouter aggregates models from multiple providers
        // Set basic capabilities - these would ideally come from the OpenRouter API
        tooling.SupportsChat = true;
        tooling.SupportsStreaming = true;
        tooling.PerformanceTier = "Balanced";
        tooling.UseCase = "Multi-provider model access";

        // Try to infer capabilities from model name
        var modelName = modelId.ToLower();
        if (modelName.Contains("vision") || modelName.Contains("claude") || modelName.Contains("gpt-4"))
        {
            tooling.SupportsVision = true;
        }
        if (modelName.Contains("gpt") || modelName.Contains("claude"))
        {
            tooling.SupportsTools = true;
            tooling.SupportsFunctionCalling = true;
            tooling.SupportsStructuredOutputs = true;
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
        // OpenRouter pricing is dynamic via their API, but we maintain static fallbacks
        return Task.FromResult(false);
    }

    /// <summary>
    /// Creates pricing from OpenRouter API response format
    /// </summary>
    public static ModelPricingDto FromOpenRouterPricing(
        string promptPrice,
        string completionPrice,
        string? imagePrice = null,
        string? requestPrice = null,
        string? webSearchPrice = null)
    {
        if (!decimal.TryParse(promptPrice, out var promptCost))
            promptCost = 0;

        if (!decimal.TryParse(completionPrice, out var completionCost))
            completionCost = 0;

        decimal? imageCost = null;
        if (!string.IsNullOrEmpty(imagePrice) && decimal.TryParse(imagePrice, out var imgCost))
            imageCost = imgCost;

        decimal? requestCost = null;
        if (!string.IsNullOrEmpty(requestPrice) && decimal.TryParse(requestPrice, out var reqCost))
            requestCost = reqCost;

        decimal? webSearchCost = null;
        if (!string.IsNullOrEmpty(webSearchPrice) && decimal.TryParse(webSearchPrice, out var wsCost))
            webSearchCost = wsCost;

        return new ModelPricingDto
        {
            PromptCostPerMillionTokens = promptCost * 1_000_000, // Convert to per million
            CompletionCostPerMillionTokens = completionCost * 1_000_000,
            ImageInputCostPerMillionTokens = imageCost * 1_000_000,
            RequestCost = requestCost,
            WebSearchCost = webSearchCost,
            Notes = "Pricing from OpenRouter API",
            LastUpdated = DateTimeOffset.UtcNow,
            IsDynamic = true,
            Currency = "USD"
        };
    }

    /// <summary>
    /// Updates fallback pricing for a specific model
    /// Useful for maintaining up-to-date fallbacks
    /// </summary>
    public void UpdateFallbackPricing(string modelId, ModelPricingDto pricing)
    {
        FallbackPricing[modelId] = pricing;
        _logger.LogInformation("Updated fallback pricing for OpenRouter model {ModelId}", modelId);
    }

    /// <summary>
    /// Extracts provider prefix from model ID for pricing lookup
    /// </summary>
    private static string? GetProviderPrefix(string modelId)
    {
        if (string.IsNullOrEmpty(modelId) || !modelId.Contains('/'))
            return null;

        var parts = modelId.Split('/');
        if (parts.Length >= 2)
        {
            return $"{parts[0]}/{parts[1]}";
        }

        return null;
    }

    /// <summary>
    /// Gets all available providers from fallback pricing
    /// </summary>
    public IEnumerable<string> GetAvailableProviders()
    {
        return FallbackPricing.Keys
            .Where(key => key.Contains('/') && key != "default")
            .Select(key => key.Split('/')[0])
            .Distinct()
            .OrderBy(provider => provider);
    }

    /// <summary>
    /// Validates if a model has reliable pricing information
    /// </summary>
    public async Task<bool> HasReliablePricingAsync(string modelId)
    {
        var pricing = await GetModelPricingAsync(modelId);
        return pricing != null && pricing.PromptCostPerMillionTokens > 0;
    }
}
