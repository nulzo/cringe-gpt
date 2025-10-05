using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Enums;
using OllamaWebuiBackend.Models;
using OllamaWebuiBackend.Services.Interfaces;
using OllamaWebuiBackend.Services.Providers.Interfaces;
using OllamaWebuiBackend.Services.Providers.Models;

namespace OllamaWebuiBackend.Services.Providers;

public abstract class BaseChatProvider : IChatProvider
{
    protected readonly IHttpClientFactory HttpClientFactory;
    protected readonly ILogger Logger;
    protected readonly ITokenizerService TokenizerService;

    protected BaseChatProvider(IHttpClientFactory httpClientFactory, ILogger logger, ITokenizerService tokenizerService)
    {
        HttpClientFactory = httpClientFactory;
        Logger = logger;
        TokenizerService = tokenizerService;
    }

    public abstract int MaxContextTokens { get; } // Each provider should define this

    public abstract ProviderType Type { get; }

    public abstract StreamedChatResponse StreamChatAsync(ChatRequest request, string? apiKey, string? apiUrl,
        CancellationToken cancellationToken);

    public abstract Task<IEnumerable<ModelResponseDto>> GetModelsAsync(string? apiKey, string? apiUrl);

    protected virtual async Task<int> GetTokenCountForMessageAsync(Message message, string model)
    {
        // A basic implementation. Providers can override this for more specific calculations
        // (e.g., accounting for roles, names, etc.).
        return await TokenizerService.GetTokenCountAsync(model, message.Content);
    }

    protected async Task<IEnumerable<Message>> GetMessagesWithinTokenLimitAsync(IEnumerable<Message> messages,
        string model)
    {
        // Bypassing token counting as requested
        return await Task.FromResult(messages);
    }
}