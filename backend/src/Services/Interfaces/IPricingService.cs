using OllamaWebuiBackend.DTOs;

namespace OllamaWebuiBackend.Services.Interfaces;

public interface IPricingService
{
    decimal CalculateCost(string model, int promptTokens, int completionTokens);
    ModelPricingDto GetModelPricing(string modelId);
    Task<decimal> CalculateCostDynamicAsync(int userId, string provider, string modelId, int promptTokens, int completionTokens, ModelPricingDto? pricing = null, int imageInputTokens = 0, int imageOutputTokens = 0);
}