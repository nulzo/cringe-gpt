using System.Collections.Concurrent;
using Microsoft.ML.Tokenizers;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Services;

public class TokenizerService : ITokenizerService
{
    // Mapping of model name fragments to the correct Tiktoken model name
    private static readonly Dictionary<string, string> TiktokenModelMap = new(StringComparer.OrdinalIgnoreCase)
    {
        { "gpt-4", "gpt-4" },
        { "gpt-3.5", "gpt-3.5" },
        { "claude", "gpt-4" }, // Claude uses the same tokenizer as GPT-4
        { "gemini", "gpt-4" } // Gemini also has a similar vocabulary structure
    };

    // Mapping for Llama models to their remote tokenizer.model file URL.
    // This would be expanded for other Llama-based models.
    private static readonly Dictionary<string, string> LlamaModelMap = new(StringComparer.OrdinalIgnoreCase)
    {
        { "llama", "https://huggingface.co/hf-internal-testing/llama-tokenizer/resolve/main/tokenizer.model" }
    };

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<TokenizerService> _logger;
    private readonly ConcurrentDictionary<string, Task<Tokenizer>> _tokenizers = new();

    public TokenizerService(IHttpClientFactory httpClientFactory, ILogger<TokenizerService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<int> GetTokenCountAsync(string model, string text)
    {
        var tokenizer = await GetTokenizerAsync(model);
        return tokenizer.CountTokens(text);
    }

    private Task<Tokenizer> GetTokenizerAsync(string modelName)
    {
        // Determine the correct tokenizer key/name
        var tiktokenModel = TiktokenModelMap.FirstOrDefault(kvp => modelName.Contains(kvp.Key)).Value;
        if (tiktokenModel != null)
            return _tokenizers.GetOrAdd(tiktokenModel,
                _ => Task.FromResult((Tokenizer)TiktokenTokenizer.CreateForModel(tiktokenModel)));

        var llamaModelUrl = LlamaModelMap.FirstOrDefault(kvp => modelName.Contains(kvp.Key)).Value;
        if (llamaModelUrl != null) return _tokenizers.GetOrAdd(llamaModelUrl, CreateLlamaTokenizerAsync);

        // Default to gpt-4 tokenizer if no specific match is found
        _logger.LogWarning("No specific tokenizer found for model {ModelName}. Defaulting to 'gpt-4' tokenizer.",
            modelName);
        return _tokenizers.GetOrAdd("gpt-4",
            _ => Task.FromResult((Tokenizer)TiktokenTokenizer.CreateForModel("gpt-4")));
    }

    private async Task<Tokenizer> CreateLlamaTokenizerAsync(string modelUrl)
    {
        _logger.LogInformation("Downloading Llama tokenizer model from {ModelUrl}", modelUrl);
        var client = _httpClientFactory.CreateClient();
        try
        {
            await using var remoteStream = await client.GetStreamAsync(modelUrl);
            return LlamaTokenizer.Create(remoteStream);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to download or create Llama tokenizer from {ModelUrl}", modelUrl);
            // Fallback to a default tokenizer to prevent total failure
            return TiktokenTokenizer.CreateForModel("gpt-4");
        }
    }
}
