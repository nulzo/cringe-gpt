using System.Collections.Concurrent;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Enums;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Services;

public class PricingService : IPricingService
{
    private readonly ILogger<PricingService> _logger;
    private readonly IEnumerable<IProviderPricingService> _providerPricingServices;
    private static readonly ConcurrentDictionary<string, ModelPricingDto> PricingCache = new();

    public PricingService(
        ILogger<PricingService> logger,
        IEnumerable<IProviderPricingService> providerPricingServices)
    {
        _logger = logger;
        _providerPricingServices = providerPricingServices;
    }
    // Prices per 1 million tokens (Input, Output)
    private static readonly Dictionary<string, (decimal, decimal)> PriceList = new(StringComparer.OrdinalIgnoreCase)
    {
        // OpenRouter - https://openrouter.ai/models
        { "openai/gpt-4o", (5.00m, 15.00m) },
        { "google/gemini-flash-1.5", (0.35m, 0.70m) },
        { "anthropic/claude-3.5-sonnet", (3.00m, 15.00m) },

        // OpenAI - https://openai.com/pricing
        { "gpt-4o", (2.50m, 10.00m) },
        { "gpt-4o-mini", (0.150m, 0.600m) },
        { "gpt-4-turbo", (10.00m, 30.00m) },
        { "gpt-3.5-turbo", (0.50m, 1.50m) },

        // Anthropic - https://www.anthropic.com/pricing
        { "claude-3-opus-20240229", (15.00m, 75.00m) },
        { "claude-3-sonnet-20240229", (3.00m, 15.00m) },
        { "claude-3-haiku-20240307", (0.25m, 1.25m) },
        { "claude-3-5-sonnet-20240620", (3.00m, 15.00m) },

        // Google - https://cloud.google.com/vertex-ai/generative-ai/pricing
        { "gemini-1.5-pro-preview-0409", (3.50m, 10.50m) },
        { "gemini-1.0-pro", (0.125m, 0.375m) }

        // Ollama models are typically self-hosted and free, so they are omitted.
    };

    public decimal CalculateCost(string model, int promptTokens, int completionTokens)
    {
        if (!PriceList.TryGetValue(model,
                out var prices)) return 0.0m; // Return 0 if model is not in the price list (e.g., Ollama)

        var (inputPrice, outputPrice) = prices;
        var totalCost = promptTokens / 1_000_000m * inputPrice + completionTokens / 1_000_000m * outputPrice;

        return totalCost;
    }

    public ModelPricingDto GetModelPricing(string modelId)
    {
        if (PriceList.TryGetValue(modelId, out var prices))
            return new ModelPricingDto
            {
                PromptCostPerMillionTokens = prices.Item1,
                CompletionCostPerMillionTokens = prices.Item2
            };

        return new ModelPricingDto
        {
            PromptCostPerMillionTokens = 0,
            CompletionCostPerMillionTokens = 0
        };
    }

    public async Task<decimal> CalculateCostDynamicAsync(int userId, string provider, string modelId, int promptTokens, int completionTokens, ModelPricingDto? pricing = null, int imageInputTokens = 0, int imageOutputTokens = 0)
    {
        try
        {
            // If pricing is provided directly, use it
            if (pricing != null)
            {
                return pricing.CalculateTotalCost(promptTokens, completionTokens, imageInputTokens: imageInputTokens, imageOutputTokens: imageOutputTokens);
            }

            // Try to get pricing from provider-specific services
            var providerPricingService = _providerPricingServices
                .FirstOrDefault(p => p.ProviderType.ToString().Equals(provider, StringComparison.OrdinalIgnoreCase));

            if (providerPricingService != null)
            {
                var modelPricing = await providerPricingService.GetModelPricingAsync(modelId);
                if (modelPricing != null)
                {
                    return modelPricing.CalculateTotalCost(promptTokens, completionTokens, imageInputTokens: imageInputTokens, imageOutputTokens: imageOutputTokens);
                }
            }

            // Fallback to old static pricing table
            _logger.LogWarning("No pricing found for {Provider}:{ModelId}, falling back to static pricing", provider, modelId);
            return CalculateCost(modelId, promptTokens, completionTokens);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed dynamic cost calc for {Provider}:{ModelId}; using static fallback", provider, modelId);
            return CalculateCost(modelId, promptTokens, completionTokens);
        }
    }
}
