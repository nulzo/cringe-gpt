using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Enums;

namespace OllamaWebuiBackend.Services.Interfaces;

public interface IModelService
{
    Task<IEnumerable<ModelResponseDto>> GetModelsAsync(int userId);
    Task<ModelResponseDto?> GetModelByIdAsync(int userId, string modelId);
    Task<IEnumerable<ModelResponseDto>> GetModelsAsync(int userId, ProviderType providerType);
}