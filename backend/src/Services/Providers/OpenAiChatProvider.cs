using System.ClientModel;
using System.Net;
using OllamaWebuiBackend.Common;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Enums;
using OllamaWebuiBackend.Models;
using OllamaWebuiBackend.Services.Interfaces;
using OllamaWebuiBackend.Services.Pricing;
using OllamaWebuiBackend.Services.Providers.Interfaces;
using OllamaWebuiBackend.Services.Providers.Models;
using OpenAI;
using OpenAI.Chat;
using OpenAI.Models;

namespace OllamaWebuiBackend.Services.Providers;

public class OpenAiChatProvider : BaseChatProvider
{
    private readonly IFileService _fileService;
    private readonly IImageGenerationProvider _imageGenerationProvider;
    private readonly IModelMappingService _modelMappingService;
    private readonly OpenAiPricingService _pricingService;

    public OpenAiChatProvider(IHttpClientFactory httpClientFactory, ILogger<OpenAiChatProvider> logger,
        ITokenizerService tokenizerService, IModelMappingService modelMappingService,
        IImageGenerationProvider imageGenerationProvider, IFileService fileService,
        OpenAiPricingService pricingService)
        : base(httpClientFactory, logger, tokenizerService)
    {
        _modelMappingService = modelMappingService;
        _imageGenerationProvider = imageGenerationProvider;
        _fileService = fileService;
        _pricingService = pricingService;
    }

    public override ProviderType Type => ProviderType.OpenAi;
    public override int MaxContextTokens => 128000; // For GPT-4o

    private StreamedChatResponse HandleImageGenerationAsync(ChatRequest request, string? apiKey, string? apiUrl,
        CancellationToken cancellationToken)
    {
        var usageDataCompletionSource = new TaskCompletionSource<UsageData>();

        async IAsyncEnumerable<StreamedContentChunk> Stream()
        {
            // Extract the prompt from the last user message
            var lastUserMessage = request.Messages.LastOrDefault(m => m.Role == "user");
            if (lastUserMessage == null)
            {
                throw new ApiException("No user message found for image generation.", HttpStatusCode.BadRequest);
            }

            // Check if we have attachments for reference-based generation
            var hasAttachments = request.Attachments != null && request.Attachments.Any();

            if (hasAttachments)
            {
                // Handle image generation with reference images
                var imageResult = await HandleImageGenerationWithReferencesAsync(request, apiKey, apiUrl, cancellationToken);
                yield return new StreamedContentChunk { TextContent = imageResult };
            }
            else
            {
                // Handle image generation from scratch
                var imageResult = await HandleImageGenerationFromScratchAsync(request, apiKey, apiUrl, cancellationToken);
                yield return new StreamedContentChunk { TextContent = imageResult };
            }

            // Set usage data (image generation typically doesn't provide token counts)
            usageDataCompletionSource.TrySetResult(new UsageData { PromptTokens = 0, CompletionTokens = 0 });
        }

        return new StreamedChatResponse
        {
            ContentStream = Stream(),
            GetUsageDataAsync = () => usageDataCompletionSource.Task
        };
    }

    private async Task<string> HandleImageGenerationWithReferencesAsync(ChatRequest request, string? apiKey, string? apiUrl, CancellationToken cancellationToken)
    {
        var lastUserMessage = request.Messages.LastOrDefault(m => m.Role == "user");
        var prompt = lastUserMessage?.Content ?? "";

        if (string.IsNullOrWhiteSpace(apiKey))
            throw new ApiException("API key is required for OpenAI.", HttpStatusCode.BadRequest);

        try
        {
            // Convert attachments to byte arrays - these are REFERENCE images for generation
            var referenceImages = new List<byte[]>();
            foreach (var attachment in request.Attachments!)
            {
                try
                {
                    // Remove data URL prefix if present
                    var base64Data = attachment.Base64Data;
                    if (base64Data.StartsWith("data:"))
                    {
                        var commaIndex = base64Data.IndexOf(',');
                        if (commaIndex > 0)
                        {
                            base64Data = base64Data.Substring(commaIndex + 1);
                        }
                    }

                    var imageBytes = Convert.FromBase64String(base64Data);
                    referenceImages.Add(imageBytes);
                }
                catch (Exception ex)
                {
                    Logger.LogError(ex, "Failed to decode base64 image data for attachment: {FileName}", attachment.FileName);
                    throw new ApiException($"Invalid image data for {attachment.FileName}", HttpStatusCode.BadRequest);
                }
            }

            var imageGenerationRequest = new ImageEditRequest
            {
                Prompt = prompt,
                Model = "gpt-image-1",
                ReferenceImages = referenceImages,
                N = 1,
                Quality = "low",
                Size = "1024x1024",
                Style = "vivid"
            };

            var imageResponse = await _imageGenerationProvider.EditImageAsync(imageGenerationRequest, apiKey, apiUrl, cancellationToken);

            // Process the generated image
            var userId = request.UserId ?? 1;
            var fileName = $"{Guid.NewGuid()}.png";
            var appFile = await _fileService.SaveFileAsync(userId, imageResponse.Images[0].Base64Data!, fileName, "image/png");

            var imageUrl = $"/api/v1/files/{appFile.Id}";
            return $"![{fileName}]({imageUrl})";
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error during image generation with gpt-image-1");
            throw new ApiException($"Failed to generate image: {ex.Message}", HttpStatusCode.InternalServerError);
        }
    }

    private async Task<string> HandleImageGenerationFromScratchAsync(ChatRequest request, string? apiKey, string? apiUrl, CancellationToken cancellationToken)
    {
        var lastUserMessage = request.Messages.LastOrDefault(m => m.Role == "user");
        var prompt = lastUserMessage?.Content ?? "";

        var imageRequest = new ImageGenerationRequest
        {
            Prompt = prompt,
            Model = request.Model ?? "gpt-image-1",
            N = 1,
            Quality = "low",
            Size = "1024x1024",
            Style = "vivid"
        };

        var imageResponse = await _imageGenerationProvider.GenerateImageAsync(imageRequest, apiKey, apiUrl, cancellationToken);

        // Process the generated image
        var userId = request.UserId ?? 1;
        var fileName = $"{Guid.NewGuid()}.png";
        var appFile = await _fileService.SaveFileAsync(userId, imageResponse.Images[0].Base64Data!, fileName, "image/png");

        var imageUrl = $"/api/v1/files/{appFile.Id}";
        return $"![{fileName}]({imageUrl})";
    }

    public override StreamedChatResponse StreamChatAsync(ChatRequest request, string? apiKey, string? apiUrl,
        CancellationToken cancellationToken)
    {
        if (request.Model.Equals("gpt-image-1", StringComparison.OrdinalIgnoreCase))
            return HandleImageGenerationAsync(request, apiKey, apiUrl, cancellationToken);

        var usageDataCompletionSource = new TaskCompletionSource<UsageData>();

        async IAsyncEnumerable<StreamedContentChunk> Stream()
        {
            if (string.IsNullOrWhiteSpace(request.Model))
                throw new ApiException("Model is required for OpenAI.", HttpStatusCode.BadRequest);
            if (string.IsNullOrWhiteSpace(apiKey))
                throw new ApiException("API key is required for OpenAI.", HttpStatusCode.BadRequest);

            var client = new ChatClient(request.Model, apiKey);

            var truncatedMessages = await GetMessagesWithinTokenLimitAsync(request.Messages, request.Model);

            var chatMessages = truncatedMessages.Select(m => (ChatMessage)(m.Role.ToLower() switch
            {
                "user" => new UserChatMessage(m.Content),
                "assistant" => new AssistantChatMessage(m.Content),
                "system" => new SystemChatMessage(m.Content),
                _ => throw new NotSupportedException($"Role {m.Role} is not supported.")
            })).ToList();

            var options = new ChatCompletionOptions
            {
                Temperature = (float?)request.Temperature,
                TopP = (float?)request.TopP,
                MaxOutputTokenCount = request.MaxTokens
            };

            var contentUpdates = new List<string>();

            try
            {
                AsyncCollectionResult<StreamingChatCompletionUpdate> stream =
                    client.CompleteChatStreamingAsync(chatMessages, options, cancellationToken);

                await foreach (var completionUpdate in stream.WithCancellation(cancellationToken))
                    if (completionUpdate.ContentUpdate.Count > 0)
                        contentUpdates.Add(completionUpdate.ContentUpdate[0].Text);
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "Error while streaming from OpenAI");
                usageDataCompletionSource.TrySetException(ex);
                throw;
            }
            finally
            {
                // Try to get usage data from the last completion update if available
                if (contentUpdates.Any())
                {
                    // For OpenAI, we'll estimate tokens based on content length
                    // This is a fallback approach since the new SDK doesn't provide usage data
                    var totalContentLength = contentUpdates.Sum(c => c.Length);
                    var estimatedCompletionTokens = (int)(totalContentLength * 0.3); // Rough estimation

                    // For prompt tokens, we'd need to count input tokens - using a basic estimation for now
                    var estimatedPromptTokens = Math.Max(100, (int)(request.Messages.Sum(m => m.Content.Length) * 0.3));

                    // Calculate cost based on OpenAI pricing
                    var cost = await CalculateOpenAICostAsync(request.Model, estimatedPromptTokens, estimatedCompletionTokens);

                    usageDataCompletionSource.TrySetResult(new UsageData
                    {
                        PromptTokens = estimatedPromptTokens,
                        CompletionTokens = estimatedCompletionTokens,
                        ActualCost = cost
                    });
                }
                else
                {
                    usageDataCompletionSource.TrySetResult(new UsageData { PromptTokens = 0, CompletionTokens = 0 });
                }
            }

            foreach (var content in contentUpdates)
                yield return new StreamedContentChunk { TextContent = content };
        }

        return new StreamedChatResponse
        {
            ContentStream = Stream(),
            GetUsageDataAsync = () => usageDataCompletionSource.Task
        };
    }

    protected override async Task<int> GetTokenCountForMessageAsync(Message message, string model)
    {
        // This is a simplified version. A full implementation would be more detailed.
        var tokensPerMessage = 3;
        var tokensPerName = 1;

        var numTokens = tokensPerMessage;
        numTokens += await TokenizerService.GetTokenCountAsync(model, message.Role);
        numTokens += await TokenizerService.GetTokenCountAsync(model, message.Content);
        numTokens += tokensPerName; // In case of 'name' property on message.

        return numTokens;
    }

    public override async Task<IEnumerable<ModelResponseDto>> GetModelsAsync(string? apiKey, string? apiUrl)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
            return Enumerable.Empty<ModelResponseDto>();

        try
        {
            var modelClient = new OpenAIModelClient(apiKey);

            ClientResult<OpenAIModelCollection> modelsResult = await modelClient.GetModelsAsync(CancellationToken.None);
            var models = modelsResult.Value;

            var response = new List<ModelResponseDto>();
            foreach (var model in models)
                try
                {
                    // Get pricing data for this model
                    var pricing = await _pricingService.GetModelPricingAsync(model.Id);

                    // Get tooling/capabilities data
                    var tooling = _pricingService.GetModelTooling(model.Id);

                    response.Add(new ModelResponseDto
                    {
                        Id = model.Id,
                        Name = model.Id,
                        Provider = ProviderType.OpenAi.ToString(),
                        ContextLength = 0,
                        Pricing = pricing ?? new ModelPricingDto(),
                        Tooling = tooling ?? new ModelToolingDto()
                    });
                }
                catch (Exception ex)
                {
                    Logger.LogWarning(ex, "Failed to process model {ModelId}", model.Id);
                }

            return response;
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error while fetching OpenAI models");
            return Enumerable.Empty<ModelResponseDto>();
        }
    }

    private async Task<decimal> CalculateOpenAICostAsync(string? model, int promptTokens, int completionTokens)
    {
        if (string.IsNullOrEmpty(model))
            return 0;

        return await _pricingService.CalculateCostAsync(model, promptTokens, completionTokens);
    }
}
