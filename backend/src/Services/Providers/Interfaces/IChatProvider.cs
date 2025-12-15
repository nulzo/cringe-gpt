using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Enums;
using OllamaWebuiBackend.Services.Providers.Models;

namespace OllamaWebuiBackend.Services.Providers.Interfaces;

public interface IChatProvider
{
    ProviderType Type { get; }

    StreamedChatResponse StreamChatAsync(ChatRequest request, string? apiKey, string? apiUrl,
        CancellationToken cancellationToken);

    Task<IEnumerable<ModelResponseDto>> GetModelsAsync(string? apiKey, string? apiUrl);
}
