using OllamaWebuiBackend.Enums;
using OllamaWebuiBackend.Services.Providers.Models;

namespace OllamaWebuiBackend.Services.Providers.Interfaces;

public interface IImageGenerationProvider
{
    ProviderType Type { get; }
    Task<ImageGenerationResponse> GenerateImageAsync(ImageGenerationRequest request, string? apiKey, string? apiUrl, CancellationToken cancellationToken);
    Task<ImageGenerationResponse> EditImageAsync(ImageEditRequest request, string? apiKey, string? apiUrl, CancellationToken cancellationToken);
} 