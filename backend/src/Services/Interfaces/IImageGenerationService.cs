using OllamaWebuiBackend.DTOs;

namespace OllamaWebuiBackend.Services.Interfaces;

public interface IImageGenerationService
{
    Task<ImageGenerationResponseDto> GenerateImageAsync(int userId, ImageGenerationRequestDto request, CancellationToken cancellationToken);
}
