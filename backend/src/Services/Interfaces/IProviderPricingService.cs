using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Enums;

namespace OllamaWebuiBackend.Services.Interfaces;

/// <summary>
/// Unified interface for provider-specific pricing services
/// </summary>
public interface IProviderPricingService
{
    /// <summary>
    /// The provider type this service handles
    /// </summary>
    ProviderType ProviderType { get; }
    /// <summary>
    /// Gets pricing information for a specific model
    /// </summary>
    Task<ModelPricingDto?> GetModelPricingAsync(string modelId);

    /// <summary>
    /// Gets tooling/capabilities information for a specific model
    /// </summary>
    ModelToolingDto GetModelTooling(string modelId);

    /// <summary>
    /// Gets all pricing information for the provider
    /// </summary>
    Task<Dictionary<string, ModelPricingDto>> GetAllModelPricingAsync();

    /// <summary>
    /// Calculates cost for given token usage
    /// </summary>
    Task<decimal> CalculateCostAsync(string modelId, int promptTokens, int completionTokens);

    /// <summary>
    /// Refreshes pricing information from the provider (if supported)
    /// </summary>
    Task<bool> RefreshPricingAsync();
}
