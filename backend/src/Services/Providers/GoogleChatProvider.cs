using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using OllamaWebuiBackend.Common;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Enums;
using OllamaWebuiBackend.Services.Interfaces;
using OllamaWebuiBackend.Services.Pricing;
using OllamaWebuiBackend.Services.Providers.Models;

namespace OllamaWebuiBackend.Services.Providers;

public class GoogleChatProvider : BaseChatProvider
{
    private readonly IConfiguration _configuration;
    private readonly GooglePricingService _pricingService;

    public GoogleChatProvider(IHttpClientFactory httpClientFactory, ILogger<GoogleChatProvider> logger,
        IConfiguration configuration, ITokenizerService tokenizerService, GooglePricingService pricingService)
        : base(httpClientFactory, logger, tokenizerService)
    {
        _configuration = configuration;
        _pricingService = pricingService;
    }

    public override ProviderType Type => ProviderType.Google;
    public override int MaxContextTokens => 30720;

    public override StreamedChatResponse StreamChatAsync(ChatRequest request, string? apiKey, string? apiUrl,
        CancellationToken cancellationToken)
    {
        var usageDataCompletionSource = new TaskCompletionSource<UsageData>();

        async IAsyncEnumerable<StreamedContentChunk> Stream()
        {
            if (string.IsNullOrWhiteSpace(request.Model))
                throw new ApiException("Model is required for Google.", HttpStatusCode.BadRequest);
            if (string.IsNullOrWhiteSpace(apiKey))
                throw new ApiException("API key is required for Google.", HttpStatusCode.BadRequest);

            var projectId = _configuration["GoogleAi:ProjectId"];
            var location = _configuration["GoogleAi:Location"];

            if (string.IsNullOrWhiteSpace(projectId) || string.IsNullOrWhiteSpace(location))
                throw new ApiException("Google AI ProjectId and Location must be configured in appsettings.");

            var url =
                $"https://{location}-aiplatform.googleapis.com/v1/projects/{projectId}/locations/{location}/publishers/google/models/{request.Model}:streamGenerateContent";

            var client = HttpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            var truncatedMessages = await GetMessagesWithinTokenLimitAsync(request.Messages, request.Model);

            var googleRequest = new
            {
                contents = truncatedMessages.Select(m => new
                {
                    role = m.Role == "assistant" ? "model" : "user",
                    parts = new[] { new { text = m.Content } }
                }),
                generation_config = new
                {
                    temperature = request.Temperature,
                    top_p = request.TopP,
                    max_output_tokens = request.MaxTokens
                }
            };

            var httpRequest = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = new StringContent(JsonSerializer.Serialize(googleRequest), Encoding.UTF8, "application/json")
            };

            var response =
                await client.SendAsync(httpRequest, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
            response.EnsureSuccessStatusCode();

            using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var reader = new StreamReader(stream);

            JsonNode? finalChunk = null;

            while (!reader.EndOfStream && !cancellationToken.IsCancellationRequested)
            {
                var line = await reader.ReadLineAsync(cancellationToken);
                if (string.IsNullOrWhiteSpace(line)) continue;

                JsonNode? jsonArray = null;
                try
                {
                    jsonArray = JsonNode.Parse(line)?.AsArray();
                }
                catch (JsonException ex)
                {
                    Logger.LogError(ex, "Failed to deserialize Google stream response chunk: {line}", line);
                }

                if (jsonArray == null) continue;

                foreach (var item in jsonArray.AsArray())
                    if (item?["candidates"]?[0]?["content"]?["parts"]?[0]?["text"] is { } textNode)
                    {
                        finalChunk = item;
                        yield return new StreamedContentChunk { TextContent = textNode.GetValue<string>() };
                    }
            }

            var promptTokens = 0;
            var completionTokens = 0;

            if (finalChunk?["usageMetadata"] is { } usageMetadata)
            {
                promptTokens = usageMetadata["promptTokenCount"]?.GetValue<int>() ?? 0;
                completionTokens = usageMetadata["candidatesTokenCount"]?.GetValue<int>() ?? 0;
            }

            var usage = new UsageData
            {
                PromptTokens = promptTokens,
                CompletionTokens = completionTokens,
                ActualCost = await CalculateGoogleCostAsync(request.Model, promptTokens, completionTokens)
            };

            usageDataCompletionSource.TrySetResult(usage);
        }

        return new StreamedChatResponse
        {
            ContentStream = Stream(),
            GetUsageDataAsync = () => usageDataCompletionSource.Task
        };
    }

    public override async Task<IEnumerable<ModelResponseDto>> GetModelsAsync(string? apiKey, string? apiUrl)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
            // Silently return empty list if API key is not provided, as this is for discovery.
            return Enumerable.Empty<ModelResponseDto>();

        var url = $"https://generativelanguage.googleapis.com/v1beta/models?key={apiKey}";
        var client = HttpClientFactory.CreateClient();

        try
        {
            var response = await client.GetAsync(url, CancellationToken.None);
            if (!response.IsSuccessStatusCode) return Enumerable.Empty<ModelResponseDto>();

            var content = await response.Content.ReadFromJsonAsync<JsonElement>();
            var models = new List<ModelResponseDto>();

            if (!content.TryGetProperty("models", out var data)) return models;

            foreach (var modelElement in data.EnumerateArray())
            {
                var modelId = modelElement.GetProperty("name").GetString()?.Replace("models/", "") ?? "";

                models.Add(new ModelResponseDto
                {
                    Id = modelId,
                    Name = modelElement.GetProperty("displayName").GetString() ?? "Unknown",
                    Provider = Type.ToString(),
                    Description = modelElement.GetProperty("description").GetString(),
                    ContextLength = modelElement.GetProperty("inputTokenLimit").GetInt32(),
                    // SupportsVision = modelElement.GetProperty("supportedGenerationMethods").EnumerateArray().Any(m => m.GetString()?.Contains("vision") ?? false),
                    Pricing = _pricingService.GetAllModelPricingAsync().Result.GetValueOrDefault(modelId) ?? new ModelPricingDto(),
                    Tooling = _pricingService.GetModelTooling(modelId)
                });
            }

            return models;
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Failed to fetch or parse models from Google Gemini API.");
            return Enumerable.Empty<ModelResponseDto>();
        }
    }

    private async Task<decimal> CalculateGoogleCostAsync(string? model, int promptTokens, int completionTokens)
    {
        if (string.IsNullOrEmpty(model))
            return 0;

        return await _pricingService.CalculateCostAsync(model, promptTokens, completionTokens);
    }
}
