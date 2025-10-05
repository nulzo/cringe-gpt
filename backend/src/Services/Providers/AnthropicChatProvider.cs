using System.Net;
using System.Text;
using System.Text.Json;
using OllamaWebuiBackend.Common;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Enums;
using OllamaWebuiBackend.Models;
using OllamaWebuiBackend.Services.Interfaces;
using OllamaWebuiBackend.Services.Pricing;
using OllamaWebuiBackend.Services.Providers.Models;

namespace OllamaWebuiBackend.Services.Providers;

public class AnthropicChatProvider : BaseChatProvider
{
    private const string AnthropicApiUrl = "https://api.anthropic.com/v1/messages";
    private readonly AnthropicPricingService _pricingService;

    public AnthropicChatProvider(IHttpClientFactory httpClientFactory, ILogger<AnthropicChatProvider> logger,
        ITokenizerService tokenizerService, AnthropicPricingService pricingService)
        : base(httpClientFactory, logger, tokenizerService)
    {
        _pricingService = pricingService;
    }

    public override ProviderType Type => ProviderType.Anthropic;
    public override int MaxContextTokens => 200000; // For Claude 3 models

    public override StreamedChatResponse StreamChatAsync(ChatRequest request, string? apiKey, string? ApiUrl,
        CancellationToken cancellationToken)
    {
        var usageDataCompletionSource = new TaskCompletionSource<UsageData>();

        async IAsyncEnumerable<StreamedContentChunk> Stream()
        {
            if (string.IsNullOrWhiteSpace(request.Model))
                throw new ApiException("Model is required for Anthropic.", HttpStatusCode.BadRequest);
            if (string.IsNullOrWhiteSpace(apiKey))
                throw new ApiException("API key is required for Anthropic.", HttpStatusCode.BadRequest);

            var client = HttpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("x-api-key", apiKey);
            client.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");

            var truncatedMessages = (await GetMessagesWithinTokenLimitAsync(request.Messages, request.Model)).ToList();

            // The Anthropic API requires that the first message is from a user.
            if (truncatedMessages.FirstOrDefault()?.Role != "user")
                // This is a simplistic fix. A more robust solution might involve re-arranging messages.
                truncatedMessages.Insert(0,
                    new Message { Role = "user", Content = "(The assistant continues the conversation)" });

            var anthropicRequest = new
            {
                model = request.Model,
                messages = truncatedMessages.Select(m => new { role = m.Role.ToLower(), content = m.Content }),
                stream = true,
                max_tokens = request.MaxTokens ?? 4096, // Anthropic requires max_tokens
                temperature = request.Temperature,
                top_p = request.TopP
            };

            var httpRequest = new HttpRequestMessage(HttpMethod.Post, AnthropicApiUrl)
            {
                Content = new StringContent(JsonSerializer.Serialize(anthropicRequest), Encoding.UTF8,
                    "application/json")
            };

            var response =
                await client.SendAsync(httpRequest, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
            response.EnsureSuccessStatusCode();

            using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var reader = new StreamReader(stream);

            while (!reader.EndOfStream && !cancellationToken.IsCancellationRequested)
            {
                var line = await reader.ReadLineAsync(cancellationToken);
                if (string.IsNullOrWhiteSpace(line)) continue;

                if (!line.StartsWith("data:")) continue;

                var data = line.Substring(5).Trim();
                string? textChunk = null;
                try
                {
                    var chunk = JsonSerializer.Deserialize<JsonElement>(data);

                    if (chunk.TryGetProperty("type", out var type))
                        switch (type.GetString())
                        {
                            case "content_block_delta":
                                if (chunk.TryGetProperty("delta", out var delta) &&
                                    delta.TryGetProperty("text", out var text)) textChunk = text.GetString();
                                break;
                            case "message_stop":
                                if (chunk.TryGetProperty("usage", out var usageElement))
                                {
                                    var promptTokens = usageElement.TryGetProperty("input_tokens", out var pt) ? pt.GetInt32() : 0;
                                    var completionTokens = usageElement.TryGetProperty("output_tokens", out var ct) ? ct.GetInt32() : 0;
                                    
                                    var usage = new UsageData
                                    {
                                        PromptTokens = promptTokens,
                                        CompletionTokens = completionTokens,
                                        ActualCost = await CalculateAnthropicCostAsync(request.Model, promptTokens, completionTokens)
                                    };
                                    usageDataCompletionSource.TrySetResult(usage);
                                }

                                break;
                        }
                }
                catch (JsonException ex)
                {
                    Logger.LogError(ex, "Failed to deserialize Anthropic stream response chunk: {data}", data);
                }

                if (textChunk != null) 
                    yield return new StreamedContentChunk { TextContent = textChunk };
            }

            // If usage data wasn't in the stream, set default
            usageDataCompletionSource.TrySetResult(new UsageData { PromptTokens = 0, CompletionTokens = 0 });
        }

        return new StreamedChatResponse
        {
            ContentStream = Stream(),
            GetUsageDataAsync = () => usageDataCompletionSource.Task
        };
    }

    public override Task<IEnumerable<ModelResponseDto>> GetModelsAsync(string? apiKey, string? ApiUrl)
    {
        if (string.IsNullOrWhiteSpace(apiKey)) return Task.FromResult(Enumerable.Empty<ModelResponseDto>());

        // The Anthropic API does not provide a models list endpoint.
        // We will return a hardcoded list of popular models.
        var staticModels = new Dictionary<string, ModelResponseDto>
        {
            {
                "claude-3-5-sonnet-20240620", new ModelResponseDto
                {
                    Id = "claude-3-5-sonnet-20240620", Name = "Claude 3.5 Sonnet", Provider = Type.ToString(),
                    Description =
                        "Most intelligent model, ideal for complex analysis, creative content generation, and strategic conversations.",
                    ContextLength = 200000,
                    Pricing = _pricingService.GetAllModelPricingAsync().Result.GetValueOrDefault("claude-3-5-sonnet-20240620") ?? new ModelPricingDto(),
                    Tooling = _pricingService.GetModelTooling("claude-3-5-sonnet-20240620")
                }
            },
            {
                "claude-3-opus-20240229", new ModelResponseDto
                {
                    Id = "claude-3-opus-20240229", Name = "Claude 3 Opus", Provider = Type.ToString(),
                    Description = "Most powerful model for highly complex tasks.",
                    ContextLength = 200000,
                    Pricing = _pricingService.GetAllModelPricingAsync().Result.GetValueOrDefault("claude-3-opus-20240229") ?? new ModelPricingDto(),
                    Tooling = _pricingService.GetModelTooling("claude-3-opus-20240229")
                }
            },
            {
                "claude-3-sonnet-20240229", new ModelResponseDto
                {
                    Id = "claude-3-sonnet-20240229", Name = "Claude 3 Sonnet", Provider = Type.ToString(),
                    Description = "Ideal balance of intelligence and speed for enterprise workloads.",
                    ContextLength = 200000,
                    Pricing = _pricingService.GetAllModelPricingAsync().Result.GetValueOrDefault("claude-3-sonnet-20240229") ?? new ModelPricingDto(),
                    Tooling = _pricingService.GetModelTooling("claude-3-sonnet-20240229")
                }
            },
            {
                "claude-3-haiku-20240307", new ModelResponseDto
                {
                    Id = "claude-3-haiku-20240307", Name = "Claude 3 Haiku", Provider = Type.ToString(),
                    Description = "Fastest and most compact model for near-instant responsiveness.",
                    ContextLength = 200000,
                    Pricing = _pricingService.GetAllModelPricingAsync().Result.GetValueOrDefault("claude-3-haiku-20240307") ?? new ModelPricingDto(),
                    Tooling = _pricingService.GetModelTooling("claude-3-haiku-20240307")
                }
            }
        };

        return Task.FromResult(staticModels.Values.AsEnumerable());
    }

    private async Task<decimal> CalculateAnthropicCostAsync(string? model, int promptTokens, int completionTokens)
    {
        if (string.IsNullOrEmpty(model))
            return 0;

        return await _pricingService.CalculateCostAsync(model, promptTokens, completionTokens);
    }
}