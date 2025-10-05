using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using OllamaWebuiBackend.Common;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.DTOs.Response.OpenRouter;
using OllamaWebuiBackend.Enums;
using OllamaWebuiBackend.Models;
using OllamaWebuiBackend.Services.Interfaces;
using OllamaWebuiBackend.Services.Pricing;
using OllamaWebuiBackend.Services.Providers.Models;

namespace OllamaWebuiBackend.Services.Providers;

public class OpenRouterChatProvider(
    IHttpClientFactory httpClientFactory,
    ILogger<OpenRouterChatProvider> logger,
    ITokenizerService tokenizerService,
    IModelMappingService modelMappingService,
    OpenRouterPricingService pricingService)
    : BaseChatProvider(httpClientFactory, logger, tokenizerService)
{
    private const string OpenRouterApiUrl = "https://openrouter.ai/api/v1/";

    public override ProviderType Type => ProviderType.OpenRouter;
    public override int MaxContextTokens => 128000;

    public override StreamedChatResponse StreamChatAsync(ChatRequest request, string? apiKey, string? apiUrl,
        CancellationToken cancellationToken)
    {
        var usageDataCompletionSource = new TaskCompletionSource<UsageData>();

        async IAsyncEnumerable<StreamedContentChunk> Stream()
        {
            if (string.IsNullOrWhiteSpace(request.Model))
                throw new ApiException("Model is required for OpenRouter.", HttpStatusCode.BadRequest);
            if (string.IsNullOrWhiteSpace(apiKey))
                throw new ApiException("API key is required for OpenRouter.", HttpStatusCode.BadRequest);

            var client = HttpClientFactory.CreateClient();
            client.BaseAddress = new Uri(OpenRouterApiUrl);
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            var truncatedMessages = await GetMessagesWithinTokenLimitAsync(request.Messages, request.Model);

            var openRouterRequest = new
            {
                model = request.Model,
                messages = ConvertMessagesToOpenRouterFormat(truncatedMessages, request.Attachments),
                stream = true,
                temperature = request.Temperature,
                top_p = request.TopP,
                max_tokens = request.MaxTokens,
                usage = new { include = true } // Enable usage accounting for cost metrics
            };

            var httpRequest = new HttpRequestMessage(HttpMethod.Post, "chat/completions")
            {
                Content = new StringContent(JsonSerializer.Serialize(openRouterRequest), Encoding.UTF8,
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
                if (string.IsNullOrWhiteSpace(line) || !line.StartsWith("data:")) continue;

                var data = line.Substring(5).Trim();
                if (data == "[DONE]") break;

                // Log response but truncate if it contains base64 images
                var logData = data.Length > 1000 && data.Contains("data:image") ?
                    data.Substring(0, 500) + "...[base64 image data truncated]..." + data.Substring(data.Length - 100) :
                    data;
                Logger.LogInformation("OpenRouter Stream Response: {data}", logData);

                StreamedContentChunk? contentChunk = null;
                var imagesToYield = new List<StreamedImageData>();

                try
                {
                    var chunk = JsonSerializer.Deserialize<JsonElement>(data);

                    // Final chunk with usage data
                    if (chunk.TryGetProperty("usage", out var usageElement))
                    {
                        var usage = new UsageData
                        {
                            PromptTokens = usageElement.TryGetProperty("prompt_tokens", out var pt) ? pt.GetInt32() : 0,
                            CompletionTokens = usageElement.TryGetProperty("completion_tokens", out var ct)
                                ? ct.GetInt32()
                                : 0,
                            ActualCost = usageElement.TryGetProperty("cost", out var costElement) ? costElement.GetDecimal() : null
                        };
                        Logger.LogInformation("OpenRouter Usage Data: PromptTokens={PromptTokens}, CompletionTokens={CompletionTokens}, Cost={Cost}",
                            usage.PromptTokens, usage.CompletionTokens, usage.ActualCost);
                        usageDataCompletionSource.TrySetResult(usage);
                        continue;
                    }

                    if (chunk.TryGetProperty("choices", out var choices) && choices.GetArrayLength() > 0)
                    {
                        var choice = choices[0];
                        if (choice.TryGetProperty("delta", out var delta))
                        {
                            contentChunk = new StreamedContentChunk();

                            // Handle text content
                            if (delta.TryGetProperty("content", out var content))
                            {
                                var textContent = content.GetString();
                                if (!string.IsNullOrEmpty(textContent))
                                {
                                    contentChunk.TextContent = textContent;
                                    Logger.LogInformation("OpenRouter Text Content: {content}", textContent);
                                }
                            }

                            // Handle images (new OpenRouter feature)
                            if (delta.TryGetProperty("images", out var images) && images.ValueKind == JsonValueKind.Array)
                            {
                                Logger.LogInformation("OpenRouter Images detected: {imageCount}", images.GetArrayLength());
                                var imageList = new List<StreamedImageData>();
                                foreach (var imageElement in images.EnumerateArray())
                                {
                                    try
                                    {
                                        if (imageElement.TryGetProperty("type", out var typeElement) &&
                                            imageElement.TryGetProperty("image_url", out var imageUrlElement) &&
                                            imageUrlElement.TryGetProperty("url", out var urlElement))
                                        {
                                            var imageUrl = urlElement.GetString();
                                            if (!string.IsNullOrWhiteSpace(imageUrl))
                                            {
                                                var imageData = new StreamedImageData
                                                {
                                                    Type = typeElement.GetString() ?? "image_url",
                                                    Url = imageUrl,
                                                    Index = imageElement.TryGetProperty("index", out var indexElement)
                                                        ? indexElement.GetInt32()
                                                        : 0
                                                };
                                                Logger.LogInformation("OpenRouter Image Data: Type={Type}, Index={Index}, UrlLength={UrlLength}",
                                                    imageData.Type, imageData.Index, imageData.Url.Length);
                                                imageList.Add(imageData);
                                            }
                                            else
                                            {
                                                Logger.LogWarning("OpenRouter Skipping image with empty URL in array element");
                                            }
                                        }
                                        else
                                        {
                                            Logger.LogWarning("OpenRouter Skipping malformed image element in array");
                                        }
                                    }
                                    catch (Exception ex)
                                    {
                                        Logger.LogError(ex, "Error processing individual image element in OpenRouter response");
                                        // Continue processing other images
                                    }
                                }

                                // Store valid images to yield outside try-catch
                                foreach (var imageData in imageList)
                                {
                                    if (!string.IsNullOrWhiteSpace(imageData.Url))
                                    {
                                        imagesToYield.Add(imageData);
                                    }
                                    else
                                    {
                                        Logger.LogWarning("OpenRouter Skipping image with empty URL at index {index}", imageData.Index);
                                    }
                                }

                                Logger.LogInformation("OpenRouter Processed {imageCount} images as separate chunks", imageList.Count);
                            }
                        }
                    }
                }
                catch (JsonException ex)
                {
                    Logger.LogError(ex, "Failed to deserialize OpenRouter stream response chunk: {data}", data);
                }
                catch (Exception ex)
                {
                    Logger.LogError(ex, "Unexpected error processing OpenRouter stream chunk: {message}", ex.Message);
                }

                // Yield images outside the try-catch block
                foreach (var imageData in imagesToYield)
                {
                    yield return new StreamedContentChunk { Images = new List<StreamedImageData> { imageData } };
                }

                // Yield content outside the try-catch block (only if it has text content)
                if (contentChunk != null && !string.IsNullOrEmpty(contentChunk.TextContent))
                {
                    Logger.LogInformation("OpenRouter Yielding content chunk with text={hasText}",
                        !string.IsNullOrEmpty(contentChunk.TextContent));
                    yield return contentChunk;
                }
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

    private object[] ConvertMessagesToOpenRouterFormat(IEnumerable<Message> messages, List<AttachmentDto>? attachments)
    {
        var openRouterMessages = new List<object>();

        foreach (var message in messages)
        {
            if (message.Role == "user" && attachments?.Any() == true)
            {
                // For vision models, format message with images
                var contentParts = new List<object>();
                
                // Add text content
                contentParts.Add(new { type = "text", text = message.Content });
                
                // Add images for the user message
                foreach (var attachment in attachments)
                {
                    try
                    {
                        // Clean up base64 data URL format
                        var base64Data = attachment.Base64Data;
                        if (!base64Data.StartsWith("data:"))
                        {
                            // Determine MIME type from file extension or default to image/jpeg
                            var mimeType = attachment.ContentType ?? "image/jpeg";
                            base64Data = $"data:{mimeType};base64,{base64Data}";
                        }

                        contentParts.Add(new 
                        { 
                            type = "image_url", 
                            image_url = new { url = base64Data }
                        });
                    }
                    catch (Exception ex)
                    {
                        Logger.LogError(ex, "Failed to process attachment for OpenRouter: {FileName}", attachment.FileName);
                    }
                }

                openRouterMessages.Add(new 
                { 
                    role = message.Role, 
                    content = contentParts.ToArray()
                });
            }
            else
            {
                // Standard text-only message
                openRouterMessages.Add(new 
                { 
                    role = message.Role, 
                    content = message.Content 
                });
            }
        }

        return openRouterMessages.ToArray();
    }

    public override async Task<IEnumerable<ModelResponseDto>> GetModelsAsync(string? apiKey, string? apiUrl)
    {
        var client = HttpClientFactory.CreateClient();
        client.BaseAddress = new Uri(OpenRouterApiUrl);

        var response = await client.GetAsync("models", CancellationToken.None);
        Logger.LogInformation("Getting models from OpenRouter. Status: {StatusCode}", response.StatusCode);
        response.EnsureSuccessStatusCode();

        var content = await response.Content.ReadFromJsonAsync<JsonElement>();
        var models = new List<ModelResponseDto>();

        if (!content.TryGetProperty("data", out var data)) return models;

        foreach (var modelElement in data.EnumerateArray())
            try
            {
                var modelDto =
                    await modelMappingService.MapProviderModelAsync<OpenRouterModelResponseItem>(modelElement);
                models.Add(modelDto);
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "Failed to map model from OpenRouter: {modelJson}", modelElement.ToString());
            }

        return models;
    }
}