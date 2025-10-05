using System.Net;
using System.Text.Json;
using OllamaWebuiBackend.Common;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.DTOs.Response.Ollama;
using OllamaWebuiBackend.Enums;
using OllamaWebuiBackend.Services.Interfaces;
using OllamaWebuiBackend.Services.Pricing;
using OllamaWebuiBackend.Services.Providers.Models;

namespace OllamaWebuiBackend.Services.Providers;

public class OllamaChatProvider : BaseChatProvider
{
    private readonly IModelMappingService _modelMappingService;
    private readonly OllamaPricingService _pricingService;

    public OllamaChatProvider(IHttpClientFactory httpClientFactory, ILogger<OllamaChatProvider> logger,
        ITokenizerService tokenizerService, IModelMappingService modelMappingService,
        OllamaPricingService pricingService)
        : base(httpClientFactory, logger, tokenizerService)
    {
        _modelMappingService = modelMappingService;
        _pricingService = pricingService;
    }

    public override ProviderType Type => ProviderType.Ollama;
    public override int MaxContextTokens => 4096;

    public override StreamedChatResponse StreamChatAsync(ChatRequest request, string? apiKey, string? apiUrl,
        CancellationToken cancellationToken)
    {
        var usageDataCompletionSource = new TaskCompletionSource<UsageData>();

        async IAsyncEnumerable<StreamedContentChunk> Stream()
        {
            if (string.IsNullOrWhiteSpace(request.Model))
                throw new ApiException("Model is required for Ollama.", HttpStatusCode.BadRequest);
            if (string.IsNullOrWhiteSpace(apiUrl))
                throw new ApiException("Ollama API URL is not configured.", HttpStatusCode.BadRequest);

            var client = HttpClientFactory.CreateClient();
            client.BaseAddress = new Uri(apiUrl);

            var truncatedMessages = await GetMessagesWithinTokenLimitAsync(request.Messages, request.Model);

            var ollamaRequest = new
            {
                model = request.Model,
                messages = truncatedMessages.Select(m => new { role = m.Role, content = m.Content }),
                stream = true,
                options = new
                {
                    temperature = request.Temperature,
                    top_p = request.TopP,
                    num_predict = request.MaxTokens
                }
            };

            var response = await client.PostAsJsonAsync("/api/chat", ollamaRequest, cancellationToken);
            response.EnsureSuccessStatusCode();

            using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var reader = new StreamReader(stream);

            while (!reader.EndOfStream && !cancellationToken.IsCancellationRequested)
            {
                var line = await reader.ReadLineAsync(cancellationToken);
                if (string.IsNullOrWhiteSpace(line)) continue;

                string? contentChunk = null;
                var isDone = false;
                JsonElement finalResponse = default;

                try
                {
                    var ollamaResponse = JsonSerializer.Deserialize<JsonElement>(line);
                    if (ollamaResponse.TryGetProperty("message", out var message) &&
                        message.TryGetProperty("content", out var content)) contentChunk = content.GetString() ?? "";

                    if (ollamaResponse.TryGetProperty("done", out var done) && done.GetBoolean())
                    {
                        isDone = true;
                        finalResponse = ollamaResponse;
                    }
                }
                catch (JsonException ex)
                {
                    Logger.LogError(ex, "Failed to deserialize Ollama stream response chunk: {line}", line);
                }

                if (contentChunk != null) 
                    yield return new StreamedContentChunk { TextContent = contentChunk };

                if (isDone)
                {
                    var usage = new UsageData
                    {
                        PromptTokens = finalResponse.TryGetProperty("prompt_eval_count", out var p) ? p.GetInt32() : 0,
                        CompletionTokens = finalResponse.TryGetProperty("eval_count", out var c) ? c.GetInt32() : 0
                    };
                    usageDataCompletionSource.SetResult(usage);
                    break;
                }
            }
        }

        return new StreamedChatResponse
        {
            ContentStream = Stream(),
            GetUsageDataAsync = () => usageDataCompletionSource.Task
        };
    }

    public override async Task<IEnumerable<ModelResponseDto>> GetModelsAsync(string? apiKey, string? apiUrl)
    {
        if (string.IsNullOrWhiteSpace(apiUrl))
            return Enumerable.Empty<ModelResponseDto>();

        var client = HttpClientFactory.CreateClient();
        client.BaseAddress = new Uri(apiUrl);

        try
        {
            var response = await client.GetAsync("/api/tags", CancellationToken.None);
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadFromJsonAsync<JsonElement>();

            if (!content.TryGetProperty("models", out var modelsElement))
                return Enumerable.Empty<ModelResponseDto>();

            Logger.LogInformation("Retrieved {Count} models from Ollama", modelsElement.GetArrayLength());

            var models = new List<ModelResponseDto>();
            foreach (var modelElement in modelsElement.EnumerateArray())
                try
                {
                    var modelDto =
                        await _modelMappingService.MapProviderModelAsync<OllamaModelListResponseItem>(modelElement);
                    models.Add(modelDto);
                }
                catch (Exception ex)
                {
                    Logger.LogError(ex, "Failed to map model from Ollama: {modelJson}", modelElement.ToString());
                }

            return models;
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Failed to fetch or parse models from Ollama.");
            return Enumerable.Empty<ModelResponseDto>();
        }
    }
}