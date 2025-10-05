using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Services.Interfaces;
using OllamaWebuiBackend.Services.Providers;
using System.Net;
using OllamaWebuiBackend.Common;
using OllamaWebuiBackend.Services.Providers.Models;
using AutoMapper;
using OllamaWebuiBackend.Models;
using OllamaWebuiBackend.Repositories.Interfaces;

namespace OllamaWebuiBackend.Services;

public class ImageGenerationService : IImageGenerationService
{
    private readonly IProviderSettingsService _settingsService;
    private readonly ImageGenerationProviderFactory _providerFactory;
    private readonly IFileService _fileService;
    private readonly IMapper _mapper;
    private readonly IConversationService _conversationService;
    private readonly IMetricsService _metricsService;
    private readonly IUserRepository _userRepository;

    public ImageGenerationService(
        IProviderSettingsService settingsService,
        ImageGenerationProviderFactory providerFactory,
        IFileService fileService,
        IMapper mapper,
        IConversationService conversationService,
        IMetricsService metricsService,
        IUserRepository userRepository)
    {
        _settingsService = settingsService;
        _providerFactory = providerFactory;
        _fileService = fileService;
        _mapper = mapper;
        _conversationService = conversationService;
        _metricsService = metricsService;
        _userRepository = userRepository;
    }

    public async Task<ImageGenerationResponseDto> GenerateImageAsync(int userId, ImageGenerationRequestDto request, CancellationToken cancellationToken)
    {
        var settings = await _settingsService.GetFullSettingsAsync(userId, request.Provider);
        var model = request.Model ?? settings.DefaultModel ?? throw new ApiException("Model must be selected or have a default.", HttpStatusCode.BadRequest);

        Conversation conversation;
        if (string.IsNullOrEmpty(request.ConversationId))
        {
            var userMessage = new Message { Role = "user", Content = request.Prompt };
            conversation = await _conversationService.CreateConversationAsync(userId, userMessage, request.Prompt.Substring(0, Math.Min(request.Prompt.Length, 50)), request.Provider);
        }
        else
        {
            conversation = await _conversationService.GetFullConversationAsync(int.Parse(request.ConversationId), userId);
            await _conversationService.AddMessageAsync(conversation.Id, userId, "user", request.Prompt, request.Provider, model, null, null, null);
        }

        var provider = _providerFactory.CreateProvider(request.Provider, model);

        var providerRequest = new ImageGenerationRequest
        {
            Prompt = request.Prompt,
            Model = model,
            N = request.N,
            Quality = request.Quality,
            ResponseFormat = request.ResponseFormat,
            Size = request.Size,
            Style = request.Style,
            Background = request.Background,
            OutputFormat = request.OutputFormat,
            OutputCompression = request.OutputCompression,
            InputFidelity = request.InputFidelity,
            Moderation = request.Moderation
        };
        
        var providerResponse = await provider.GenerateImageAsync(providerRequest, settings.ApiKey, settings.ApiUrl, cancellationToken);

        var assistantMessageContent = "";
        foreach (var imageData in providerResponse.Images)
        {
            if (imageData.Base64Data != null)
            {
                var fileName = $"{Guid.NewGuid()}.png";
                var appFile = await _fileService.SaveFileAsync(userId, imageData.Base64Data, fileName, "image/png");

                var imageUrl = $"/api/v1/files/{appFile.Id}";
                assistantMessageContent += $"![{fileName}]({imageUrl}) ";
            }
        }

        var assistantMessage = await _conversationService.AddMessageAsync(conversation.Id, userId, "assistant", assistantMessageContent.Trim(), request.Provider, model, null, null, "stop");

        // Record metrics for image generation
        await RecordImageGenerationMetricsAsync(userId, conversation, assistantMessage, request, providerResponse);

        return new ImageGenerationResponseDto
        {
            AssistantMessageContent = assistantMessageContent.Trim(),
            ConversationId = conversation.Id.ToString()
        };
    }

    private async Task RecordImageGenerationMetricsAsync(int userId, Conversation conversation, Message assistantMessage,
        ImageGenerationRequestDto request, ImageGenerationResponse providerResponse)
    {
        try
        {
            // Estimate tokens for image generation
            var promptTokens = EstimatePromptTokens(request.Prompt);
            var imageTokens = EstimateImageTokens(request, providerResponse);

            // Get user for metrics recording
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null) return;

            // Record metrics with estimated tokens
            await _metricsService.RecordUsageAsync(
                user,
                conversation,
                assistantMessage,
                request.Model!,
                promptTokens,
                0, // No completion tokens for image generation
                1000, // Estimated duration for image generation
                null, // Let the metrics service calculate cost based on tokens
                imageInputTokens: 0, // For image generation, input tokens are for the prompt
                imageOutputTokens: imageTokens); // Output tokens are for the generated images
        }
        catch (Exception ex)
        {
            // Log error but don't fail the image generation
            Console.WriteLine($"Failed to record image generation metrics: {ex.Message}");
        }
    }

    private int EstimatePromptTokens(string prompt)
    {
        // Rough estimation: 1 token per 4 characters
        return Math.Max(10, prompt.Length / 4);
    }

    private int EstimateImageTokens(ImageGenerationRequestDto request, ImageGenerationResponse providerResponse)
    {
        // Estimate image tokens based on size and quality
        // This is a rough estimation based on OpenAI's tokenization
        var baseTokens = 85; // Base tokens for small images

        if (!string.IsNullOrEmpty(request.Size))
        {
            var sizeParts = request.Size.Split('x');
            if (sizeParts.Length == 2 &&
                int.TryParse(sizeParts[0], out var width) &&
                int.TryParse(sizeParts[1], out var height))
            {
                // Calculate pixels and estimate tokens
                var pixels = width * height;

                // Higher resolution images use more tokens
                if (pixels > 512 * 512)
                {
                    baseTokens = 170; // Medium images
                }
                if (pixels > 1024 * 1024)
                {
                    baseTokens = 340; // Large images
                }
            }
        }

        // Quality affects token count
        if (request.Quality == "hd")
        {
            baseTokens = (int)(baseTokens * 2.0); // HD doubles the tokens
        }

        // Number of images
        return baseTokens * request.N;
    }
}