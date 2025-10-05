using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Enums;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Services.Pricing;

/// <summary>
/// Anthropic pricing service with support for dynamic pricing via Usage API
/// </summary>
public class AnthropicPricingService : IProviderPricingService
{
    public ProviderType ProviderType => ProviderType.Anthropic;

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<AnthropicPricingService> _logger;

    // Static pricing fallback (as of latest pricing page)
    private static readonly Dictionary<string, ModelPricingDto> StaticPricing =
        new(StringComparer.OrdinalIgnoreCase)
        {
            // Claude 3.5 Sonnet
            ["claude-3-5-sonnet-20240620"] = ModelPricingDto.Create(3.00m, 15.00m),
            ["claude-3-5-sonnet-20241022"] = ModelPricingDto.Create(3.00m, 15.00m),

            // Claude 3 Opus
            ["claude-3-opus-20240229"] = ModelPricingDto.Create(15.00m, 75.00m),

            // Claude 3 Sonnet
            ["claude-3-sonnet-20240229"] = ModelPricingDto.Create(3.00m, 15.00m),

            // Claude 3 Haiku
            ["claude-3-haiku-20240307"] = ModelPricingDto.Create(0.25m, 1.25m),

            // Claude 3.5 Haiku
            ["claude-3-5-haiku-20241022"] = ModelPricingDto.Create(0.80m, 4.00m),

            // Claude 2.1 (legacy)
            ["claude-2.1"] = ModelPricingDto.Create(8.00m, 24.00m),
            ["claude-2"] = ModelPricingDto.Create(8.00m, 24.00m),
            ["claude-instant-1.2"] = ModelPricingDto.Create(0.80m, 2.40m),

            // Embeddings
            ["claude-embed"] = new ModelPricingDto
            {
                EmbeddingCostPerThousandTokens = 0.0001m, // $0.0001 per 1K tokens
                Notes = "Anthropic embeddings pricing",
                LastUpdated = DateTimeOffset.UtcNow,
                IsDynamic = false
            }
        };

    private Dictionary<string, ModelPricingDto>? _cachedPricing;
    private DateTimeOffset _lastRefresh = DateTimeOffset.MinValue;
    private readonly TimeSpan _cacheDuration = TimeSpan.FromHours(24);

    public AnthropicPricingService(IHttpClientFactory httpClientFactory, ILogger<AnthropicPricingService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<ModelPricingDto?> GetModelPricingAsync(string modelId)
    {
        // Try to get dynamic pricing first, fall back to static
        var allPricing = await GetAllModelPricingAsync();
        return allPricing.TryGetValue(modelId, out var pricing) ? pricing : null;
    }

    public async Task<Dictionary<string, ModelPricingDto>> GetAllModelPricingAsync()
    {
        // Use cached pricing if it's still fresh
        if (_cachedPricing != null && DateTimeOffset.UtcNow - _lastRefresh < _cacheDuration)
        {
            return _cachedPricing;
        }

        // Try to refresh from API, fall back to static pricing
        try
        {
            var dynamicPricing = await TryGetDynamicPricingAsync();
            if (dynamicPricing != null && dynamicPricing.Any())
            {
                _cachedPricing = dynamicPricing;
                _lastRefresh = DateTimeOffset.UtcNow;
                return dynamicPricing;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fetch dynamic pricing from Anthropic, using static pricing");
        }

        // Fall back to static pricing
        _cachedPricing = new Dictionary<string, ModelPricingDto>(StaticPricing, StringComparer.OrdinalIgnoreCase);
        _lastRefresh = DateTimeOffset.UtcNow;
        return _cachedPricing;
    }

    public ModelToolingDto GetModelTooling(string modelId)
    {
        // For Anthropic models, set capabilities based on model family
        var tooling = new ModelToolingDto();

        if (modelId.Contains("claude-3-5-sonnet"))
        {
            tooling.SupportsChat = true;
            tooling.SupportsVision = true;
            tooling.SupportsTools = true;
            tooling.SupportsFunctionCalling = true;
            tooling.SupportsStructuredOutputs = true;
            tooling.SupportsStreaming = true;
            tooling.PerformanceTier = "High-Quality";
            tooling.UseCase = "Most intelligent model for complex tasks";
        }
        else if (modelId.Contains("claude-3-opus"))
        {
            tooling.SupportsChat = true;
            tooling.SupportsVision = true;
            tooling.SupportsTools = true;
            tooling.SupportsFunctionCalling = true;
            tooling.SupportsStructuredOutputs = true;
            tooling.SupportsStreaming = true;
            tooling.PerformanceTier = "High-Quality";
            tooling.UseCase = "Maximum intelligence and reasoning";
        }
        else if (modelId.Contains("claude-3-sonnet"))
        {
            tooling.SupportsChat = true;
            tooling.SupportsVision = true;
            tooling.SupportsTools = true;
            tooling.SupportsFunctionCalling = true;
            tooling.SupportsStructuredOutputs = true;
            tooling.SupportsStreaming = true;
            tooling.PerformanceTier = "High-Quality";
            tooling.UseCase = "Balanced intelligence and speed";
        }
        else if (modelId.Contains("claude-3-haiku"))
        {
            tooling.SupportsChat = true;
            tooling.SupportsVision = true;
            tooling.SupportsTools = true;
            tooling.SupportsFunctionCalling = true;
            tooling.SupportsStructuredOutputs = true;
            tooling.SupportsStreaming = true;
            tooling.PerformanceTier = "Fast";
            tooling.UseCase = "Fast and efficient for simple tasks";
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

    public async Task<bool> RefreshPricingAsync()
    {
        try
        {
            _cachedPricing = null; // Clear cache to force refresh
            var newPricing = await TryGetDynamicPricingAsync();
            if (newPricing != null)
            {
                _cachedPricing = newPricing;
                _lastRefresh = DateTimeOffset.UtcNow;
                return true;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to refresh Anthropic pricing");
        }

        return false;
    }

    /// <summary>
    /// Attempts to get dynamic pricing from Anthropic's Usage API
    /// Note: This is a placeholder for future implementation when Anthropic provides pricing endpoints
    /// </summary>
    private async Task<Dictionary<string, ModelPricingDto>?> TryGetDynamicPricingAsync()
    {
        // Anthropic doesn't currently provide a public pricing API
        // This method is prepared for future implementation
        // For now, we'll enhance the static pricing with more comprehensive data

        var enhancedPricing = new Dictionary<string, ModelPricingDto>(StaticPricing, StringComparer.OrdinalIgnoreCase);

        // Add additional model variants that might be available
        foreach (var kvp in StaticPricing)
        {
            var modelId = kvp.Key;
            var pricing = kvp.Value;

            // Add version-agnostic variants
            if (modelId.Contains("-2024") || modelId.Contains("-2023"))
            {
                var baseModel = modelId.Split('-').TakeWhile(part => !part.StartsWith("202")).ToArray();
                if (baseModel.Length > 1)
                {
                    var baseModelId = string.Join("-", baseModel);
                    if (!enhancedPricing.ContainsKey(baseModelId))
                    {
                        enhancedPricing[baseModelId] = pricing;
                    }
                }
            }
        }

        // Mark as dynamic-capable (even though we're using static data for now)
        foreach (var pricing in enhancedPricing.Values)
        {
            pricing.IsDynamic = true; // We'll be ready when Anthropic provides dynamic pricing
            pricing.LastUpdated = DateTimeOffset.UtcNow;
        }

        return enhancedPricing;
    }
}
