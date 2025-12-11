using System.Diagnostics;
using System.Net;
using System.Runtime.CompilerServices;
using System.Text;
using AutoMapper;
using OllamaWebuiBackend.Common;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Enums;
using OllamaWebuiBackend.Models;
using OllamaWebuiBackend.Repositories.Interfaces;
using OllamaWebuiBackend.Services.Interfaces;
using OllamaWebuiBackend.Services.Providers;
using OllamaWebuiBackend.Services.Providers.Models;
using ChatRequest = OllamaWebuiBackend.Services.Providers.Models.ChatRequest;

namespace OllamaWebuiBackend.Services;

public class ChatService : IChatService
{
    private readonly ILogger<ChatService> _logger;
    private readonly IConversationRepository _conversationRepository;
    private readonly IConversationService _conversationService;
    private readonly IMetricsService _metricsService;
    private readonly IOperationalMetricsService _operationalMetricsService;
    private readonly ChatProviderFactory _providerFactory;
    private readonly IProviderSettingsService _settingsService;
    private readonly IUserRepository _userRepository;
    private readonly IMapper _mapper;
    private readonly IStreamBufferService _streamBufferService;
    private readonly IFileService _fileService;
    private readonly INotificationService _notificationService;

    public ChatService(ILogger<ChatService> logger,
        IConversationService conversationService,
        IProviderSettingsService settingsService,
        ChatProviderFactory providerFactory,
        IMetricsService metricsService,
        IOperationalMetricsService operationalMetricsService,
        IConversationRepository conversationRepository,
        IUserRepository userRepository,
        IMapper mapper,
        IStreamBufferService streamBufferService,
        IFileService fileService,
        INotificationService notificationService)
    {
        _logger = logger;
        _conversationService = conversationService;
        _settingsService = settingsService;
        _providerFactory = providerFactory;
        _metricsService = metricsService;
        _operationalMetricsService = operationalMetricsService;
        _conversationRepository = conversationRepository;
        _userRepository = userRepository;
        _mapper = mapper;
        _streamBufferService = streamBufferService;
        _fileService = fileService;
        _notificationService = notificationService;
    }

    public async Task<Message> GetCompletionAsync(int userId, ChatRequestDto request, CancellationToken cancellationToken)
    {
        request.Stream = false;

        Message? finalMessage = null;

        var stream = GetCompletionStreamAsync(userId, request, cancellationToken);
        await foreach (var item in stream.WithCancellation(cancellationToken))
            if (item is FinalMessageStreamEvent finalMessageEvent)
                finalMessage = finalMessageEvent.Data;

        return finalMessage ??
               throw new ApiException("Failed to get a response from the provider.", HttpStatusCode.InternalServerError);
    }

    public async IAsyncEnumerable<StreamEvent> GetCompletionStreamAsync(int userId, ChatRequestDto request,
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        var providerType = request.Provider ??
                           throw new ApiException("Provider is required to start or continue a conversation.",
                               HttpStatusCode.BadRequest);
        var settings = await _settingsService.GetFullSettingsAsync(userId, providerType);
        var model = request.Model ?? settings.DefaultModel ??
                    throw new ApiException("Model must be selected or have a default.", HttpStatusCode.BadRequest);

        _operationalMetricsService.RecordChatCompletion(providerType.ToString(), model, request.Stream);

        var stream = request.IsTemporary
            ? HandleTemporaryChatAsync(request, settings, model, cancellationToken)
            : HandlePersistentChatAsync(userId, request, settings, model, cancellationToken);

        await foreach (var item in stream.WithCancellation(cancellationToken)) yield return item;
    }

    private async IAsyncEnumerable<StreamEvent> HandleTemporaryChatAsync(ChatRequestDto request,
        ProviderSettings settings, string model, [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        var messages = new List<Message> { _mapper.Map<Message>(request) };
        var chatRequest = _mapper.Map<ChatRequest>(request);
        chatRequest.Model = model;
        chatRequest.Messages = messages;
        
        var provider = _providerFactory.CreateProvider(chatRequest.ProviderType);

        var assistantResponse = new StringBuilder();
        var streamedImages = new List<StreamedImageData>();
        var providerResponse = provider.StreamChatAsync(chatRequest, settings.ApiKey, settings.ApiUrl, cancellationToken);

        var providerStream = StreamProviderContent(providerResponse, assistantResponse,
            chatRequest.ProviderType.ToString(), model, request.Stream, streamedImages, cancellationToken);

        await foreach (var streamEvent in providerStream)
            yield return streamEvent;

        var assistantMessage = new Message
        {
            Role = "assistant",
            Content = assistantResponse.ToString(),
            Model = model
        };

        yield return new FinalMessageStreamEvent { Data = assistantMessage };
    }

    private async IAsyncEnumerable<StreamEvent> HandlePersistentChatAsync(int userId, ChatRequestDto request,
        ProviderSettings settings, string model, [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(userId) ?? throw new ApiException("User not found", HttpStatusCode.NotFound);
        var (conversation, userMessage) = await PrepareConversationState(userId, request);
        
        // Send conversation ID as the FIRST event for new conversations
        if (conversation.Id == 0)
        {
            // Save conversation first to get the ID
            await _conversationRepository.AddAsync(conversation);
            await _conversationRepository.SaveChangesAsync();
        
            // Send conversation ID immediately
            yield return new ConversationChunkStreamEvent { Data = conversation.Id.ToString() };
        }

        var chatRequest = _mapper.Map<ChatRequest>(request);
        chatRequest.Model = model;
        chatRequest.Messages = conversation.Messages;

        if (!string.IsNullOrWhiteSpace(chatRequest.SystemPrompt))
        {
            var systemMessage = new Message
            {
                Role = "system",
                Content = chatRequest.SystemPrompt,
                ConversationId = conversation.Id
            };
            
            // Insert system message at the beginning
            var messagesList = chatRequest.Messages.ToList();
            messagesList.Insert(0, systemMessage);
            chatRequest.Messages = messagesList;
        }
        
        var provider = _providerFactory.CreateProvider(chatRequest.ProviderType);
        var assistantResponse = new StringBuilder();
        var streamedImages = new List<StreamedImageData>();
        var emittedImageCount = 0;

        var stopwatch = Stopwatch.StartNew();
        var providerResponse = provider.StreamChatAsync(chatRequest, settings.ApiKey, settings.ApiUrl, cancellationToken);

        var providerStream = StreamProviderContent(providerResponse, assistantResponse,
            chatRequest.ProviderType.ToString(), model, request.Stream, streamedImages, cancellationToken);

        Message? assistantMessage = null;
        UsageData? usageData = null;

        Exception? streamError = null;

        await using (var enumerator = providerStream.GetAsyncEnumerator(cancellationToken))
        {
            while (true)
            {
                bool hasNext;
                try
                {
                    hasNext = await enumerator.MoveNextAsync();
                }
                catch (Exception ex)
                {
                    streamError = ex;
                    break;
                }

                if (!hasNext) break;

                var streamEvent = enumerator.Current;
                yield return streamEvent;

                // Also yield image events if we have images and streaming is enabled
                if (request.Stream && streamedImages.Count > emittedImageCount)
                {
                    // Yield only new images since last emission
                    for (var i = emittedImageCount; i < streamedImages.Count; i++)
                    {
                        yield return new ImageStreamEvent { Data = streamedImages[i] };
                    }
                    emittedImageCount = streamedImages.Count;
                }
            }
        }

        stopwatch.Stop();

        if (streamError == null)
        {
            usageData = await providerResponse.GetUsageDataAsync();
            assistantMessage = await BuildAssistantMessageAsync(user, conversation, userMessage, assistantResponse, streamedImages, model, chatRequest.ProviderType, usageData);
        }
        else
        {
            _operationalMetricsService.RecordProviderError(chatRequest.ProviderType.ToString(), model);
            assistantMessage = await BuildErrorAssistantMessageAsync(conversation, userMessage, streamError, chatRequest.ProviderType, model);
            yield return new ErrorStreamEvent
            {
                Data = new
                {
                    code = "chat_generation_failed",
                    message = "The assistant failed to generate a reply.",
                    detail = streamError.Message,
                    retryable = true
                }
            };
        }

        if (assistantMessage != null)
        {
            if (conversation.Id == 0)
                await _conversationRepository.AddAsync(conversation);
            await _conversationRepository.SaveChangesAsync();

            yield return new FinalMessageStreamEvent { Data = assistantMessage };

            if (usageData != null && !assistantMessage.IsError)
            {
                var metric = await _metricsService.RecordUsageAsync(user, conversation, assistantMessage, model,
                    usageData.PromptTokens, usageData.CompletionTokens, (int)stopwatch.ElapsedMilliseconds, usageData.ActualCost);
                yield return new MetricsStreamEvent { Data = metric };

                // Notify via SignalR so UI can show a toast if user is not on this conversation
                try
                {
                    await _notificationService.NotifyConversationCompletedAsync(user.Id, conversation.Id, assistantMessage.MessageId);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to send completion notification for conversation {ConversationId}", conversation.Id);
                }
            }
        }
    }

    private async IAsyncEnumerable<StreamEvent> StreamProviderContent(
        StreamedChatResponse providerResponse,
        StringBuilder assistantResponseBuilder,
        string providerType,
        string model,
        bool streamEnabled,
        List<StreamedImageData> streamedImages,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var stopwatch = Stopwatch.StartNew();
        var enumerator = providerResponse.ContentStream.WithCancellation(cancellationToken).GetAsyncEnumerator();

        // Create raw text stream from provider
        async IAsyncEnumerable<string> RawTextStream()
        {
            while (true)
            {
                try
                {
                    if (!await enumerator.MoveNextAsync()) break;
                }
                catch (Exception)
                {
                    stopwatch.Stop();
                    _operationalMetricsService.RecordProviderResponseTime(stopwatch.Elapsed.TotalSeconds, providerType, model);
                    _operationalMetricsService.RecordProviderError(providerType, model);
                    throw;
                }

                var chunk = enumerator.Current;

                // Handle text content
                if (!string.IsNullOrEmpty(chunk.TextContent))
                {
                    assistantResponseBuilder.Append(chunk.TextContent);
                    yield return chunk.TextContent;
                }

                // Handle images
                if (chunk.Images?.Any() == true)
                {
                    foreach (var image in chunk.Images)
                    {
                        // Collect image for final message
                        streamedImages.Add(image);
                        _logger.LogInformation("Collected image {index} for final message. Total images: {count}", image.Index, streamedImages.Count);

                        if (streamEnabled)
                        {
                            // For images, we don't yield text content, just collect them
                            // The image events will be handled separately in the main stream
                        }
                    }
                }
            }
        }

        // Apply smooth streaming if enabled
        if (streamEnabled)
        {
            var smoothTextStream = _streamBufferService.CreateSmoothStreamAsync(
                RawTextStream(),
                cancellationToken: cancellationToken);

            await foreach (var smoothChunk in smoothTextStream)
            {
                yield return new ContentStreamEvent { Data = smoothChunk };
            }
        }
        else
        {
            // If not streaming, just process the raw content
            await foreach (var chunk in RawTextStream())
            {
                // Raw text is already appended to assistantResponseBuilder above
            }
        }

        stopwatch.Stop();
        _operationalMetricsService.RecordProviderResponseTime(stopwatch.Elapsed.TotalSeconds, providerType, model);
    }

    private async Task<Message> BuildAssistantMessageAsync(AppUser user, Conversation conversation, Message userMessage,
        StringBuilder assistantResponse, List<StreamedImageData> streamedImages, string model, ProviderType providerType, UsageData usageData)
    {
        if (assistantResponse.Length == 0)
            throw new ApiException("Provider returned no content.", HttpStatusCode.BadGateway);

        var content = assistantResponse.ToString();
        var (parsedContent, imageUrls) = ParseMarkdownImages(content);

        var assistantMessage = new Message
        {
            Role = "assistant",
            Content = parsedContent,
            Provider = providerType,
            Model = model,
            ParentMessageId = userMessage.MessageId,
            TokenCount = usageData.CompletionTokens,
            FinishReason = "complete",
            ConversationId = conversation.Id,
            HasImages = streamedImages.Any() || imageUrls.Any()
        };

        // Store image URLs in ToolCallsJson for non-streamed images
        if (imageUrls.Any() && !streamedImages.Any())
        {
            var fileIds = ExtractFileIdsFromUrls(imageUrls);
            if (fileIds.Any())
            {
                assistantMessage.ToolCallsJson = System.Text.Json.JsonSerializer.Serialize(fileIds);
            }
        }

        // Save streamed images as files
        if (streamedImages.Any())
        {
            var savedImages = new List<MessageImageDto>();

            foreach (var imageData in streamedImages)
            {
                try
                {
                    var base64Data = imageData.Url;
                    string mimeType = "image/png";

                    if (base64Data.StartsWith("data:image/"))
                    {
                        var parts = base64Data.Split(',');
                        if (parts.Length == 2)
                        {
                            var mimePart = parts[0];
                            base64Data = parts[1];
                            if (mimePart.Contains("jpeg") || mimePart.Contains("jpg"))
                                mimeType = "image/jpeg";
                        }
                    }

                    var imageBytes = Convert.FromBase64String(base64Data);
                    var fileName = $"streamed-image-{imageData.Index}-{DateTime.UtcNow.Ticks}.png";
                    var appFile = await _fileService.SaveFileAsync(user.Id, imageBytes, fileName, mimeType);

                    savedImages.Add(new MessageImageDto
                    {
                        Id = appFile.Id,
                        Name = $"Generated Image {imageData.Index + 1}",
                        Url = $"/api/v1/files/{appFile.Id}",
                        MimeType = mimeType
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to save streamed image {index}: {message}", imageData.Index, ex.Message);
                }
            }

            if (savedImages.Any())
            {
                assistantMessage.ToolCallsJson = System.Text.Json.JsonSerializer.Serialize(savedImages);
            }
        }

        streamedImages.Clear();
        conversation.Messages.Add(assistantMessage);
        return assistantMessage;
    }

    private async Task<Message> BuildErrorAssistantMessageAsync(Conversation conversation, Message userMessage, Exception ex, ProviderType providerType, string model)
    {
        var assistantMessage = new Message
        {
            Role = "assistant",
            Content = $"The assistant ran into a problem: {ex.Message}",
            Provider = providerType,
            Model = model,
            ParentMessageId = userMessage.MessageId,
            FinishReason = "error",
            ConversationId = conversation.Id,
            IsError = true,
            Error = new MessageError
            {
                Title = "Generation failed",
                Description = ex.Message,
                ErrorCode = "chat_generation_failed"
            }
        };

        conversation.Messages.Add(assistantMessage);
        await _conversationRepository.SaveChangesAsync();
        return assistantMessage;
    }
    
    private (string parsedContent, List<string> imageUrls) ParseMarkdownImages(string content)
    {
        var imageUrls = new List<string>();
        var regex = new System.Text.RegularExpressions.Regex(@"!\[([^\]]*)\]\(([^)]+)\)");
        var matches = regex.Matches(content);

        foreach (System.Text.RegularExpressions.Match match in matches)
        {
            if (match.Groups.Count >= 3)
            {
                var url = match.Groups[2].Value;
                if (url.StartsWith("/api/v1/files/"))
                {
                    imageUrls.Add(url);
                }
            }
        }

        return (content, imageUrls);
    }

    private List<int> ExtractFileIdsFromUrls(List<string> imageUrls)
    {
        var fileIds = new List<int>();
        foreach (var url in imageUrls)
        {
            if (url.StartsWith("/api/v1/files/"))
            {
                var parts = url.Split('/');
                if (parts.Length >= 4 && int.TryParse(parts[3], out var fileId))
                {
                    fileIds.Add(fileId);
                }
            }
        }
        return fileIds;
    }

    private async Task<(Conversation, Message)> PrepareConversationState(int userId, ChatRequestDto request)
{
    Conversation conversation;
    var userMessage = _mapper.Map<Message>(request);

    // Handle attachments manually since AutoMapper can't map them
    if (request.Attachments?.Any() == true)
    {
        userMessage.HasImages = true;
        
        // Save each attachment and create file records
        var savedFiles = new List<AppFile>();
        foreach (var attachment in request.Attachments)
        {
            try
            {
                // Decode base64 data
                var imageBytes = Convert.FromBase64String(attachment.Base64Data);
                
                // Save file to filesystem and database
                var appFile = await _fileService.SaveFileAsync(userId, imageBytes, attachment.FileName, attachment.ContentType);
                savedFiles.Add(appFile);
            }
            catch (Exception ex)
            {
                // Log the error but don't fail the entire request
                _logger.LogError(ex, "Failed to save attachment {FileName}", attachment.FileName);
                userMessage.Content += $"\n\n[Failed to save attachment: {attachment.FileName}]";
            }
        }
        
        // Store file IDs in ToolCallsJson for easy retrieval
        if (savedFiles.Any())
        {
            var fileIds = savedFiles.Select(f => f.Id).ToList();
            userMessage.ToolCallsJson = System.Text.Json.JsonSerializer.Serialize(fileIds);
        }
    }

    if (request.ConversationId.HasValue)
    {
        conversation = await _conversationService.GetFullConversationAsync(request.ConversationId.Value, userId);
        var lastMessage = conversation.Messages.LastOrDefault();
        userMessage.ParentMessageId = lastMessage?.MessageId;
        userMessage.ConversationId = conversation.Id;
    }
    else
    {
        var title = request.Message.Length > 50 ? request.Message.Substring(0, 50) + "..." : request.Message;
        conversation = new Conversation
        {
            UserId = userId,
            Title = title,
            Provider = request.Provider!.Value
        };
    }
    
    conversation.Messages.Add(userMessage);

    return (conversation, userMessage);
}
}