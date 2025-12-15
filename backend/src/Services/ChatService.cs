using System.Diagnostics;
using System.Net;
using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
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
    private readonly IAgentRepository _agentRepository;
    private readonly IPromptRepository _promptRepository;

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
        INotificationService notificationService,
        IAgentRepository agentRepository,
        IPromptRepository promptRepository)
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
        _agentRepository = agentRepository;
        _promptRepository = promptRepository;
    }

    public async Task<MessageDto> GetCompletionAsync(int userId, ChatRequestDto request, CancellationToken cancellationToken)
    {
        request.Stream = false;

        MessageDto? finalMessage = null;

        var stream = GetCompletionStreamAsync(userId, request, cancellationToken);
        await foreach (var item in stream.WithCancellation(cancellationToken))
            if (item is FinalMessageStreamEvent finalMessageEvent)
            {
                if (finalMessageEvent.Data is MessageDto dto)
                {
                    finalMessage = dto;
                }
            }

        return finalMessage ??
               throw new ApiException("Failed to get a response from the provider.", HttpStatusCode.InternalServerError);
    }

    public async IAsyncEnumerable<StreamEvent> GetCompletionStreamAsync(int userId, ChatRequestDto request,
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        var normalizedRequest = await EnrichRequestAsync(userId, request, cancellationToken);

        var providerType = normalizedRequest.Provider ??
                           throw new ApiException("Provider is required to start or continue a conversation.",
                               HttpStatusCode.BadRequest);
        var settings = await _settingsService.GetFullSettingsAsync(userId, providerType);
        var model = normalizedRequest.Model ?? settings.DefaultModel ??
                    throw new ApiException("Model must be selected or have a default.", HttpStatusCode.BadRequest);

        _operationalMetricsService.RecordChatCompletion(providerType.ToString(), model, request.Stream);

        var stream = normalizedRequest.IsTemporary
            ? HandleTemporaryChatAsync(normalizedRequest, settings, model, cancellationToken)
            : HandlePersistentChatAsync(userId, normalizedRequest, settings, model, cancellationToken);

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

        yield return new FinalMessageStreamEvent { Data = _mapper.Map<MessageDto>(assistantMessage) };
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
                catch (OperationCanceledException)
                {
                    // Handle cancellation by breaking the loop gracefully
                    break;
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
            if (cancellationToken.IsCancellationRequested)
            {
                // Handle cancelled generation - save partial content
                assistantMessage = await BuildAssistantMessageAsync(user, conversation, userMessage, assistantResponse, streamedImages, model, chatRequest.ProviderType, null, "cancelled");
            }
            else
            {
                usageData = await providerResponse.GetUsageDataAsync();
                assistantMessage = await BuildAssistantMessageAsync(user, conversation, userMessage, assistantResponse, streamedImages, model, chatRequest.ProviderType, usageData);
            }
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

            yield return new FinalMessageStreamEvent { Data = _mapper.Map<MessageDto>(assistantMessage) };

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

    private async Task<ChatRequestDto> EnrichRequestAsync(int userId, ChatRequestDto request, CancellationToken cancellationToken)
    {
        if (request.PersonaId.HasValue)
        {
            var persona = await _agentRepository.GetByIdForUserAsync(request.PersonaId.Value, userId)
                          ?? throw new ApiException("Persona not found.", HttpStatusCode.NotFound);

            var personaParameters = DeserializePersonaParameters(persona.ModelParametersJson);
            request.Temperature ??= personaParameters.Temperature;
            request.TopP ??= personaParameters.TopP;
            request.TopK ??= personaParameters.TopK;
            request.MaxTokens ??= personaParameters.MaxTokens;
            if (personaParameters.IsTemporary == true) request.IsTemporary = true;

            if (!string.IsNullOrWhiteSpace(persona.Instructions))
            {
                request.SystemPrompt = string.IsNullOrWhiteSpace(request.SystemPrompt)
                    ? persona.Instructions
                    : $"{persona.Instructions}\n\n{request.SystemPrompt}";
            }
        }

        if (request.PromptId.HasValue)
        {
            var prompt = await _promptRepository.GetByIdForUserAsync(request.PromptId.Value, userId)
                         ?? throw new ApiException("Prompt not found.", HttpStatusCode.NotFound);

            var providedVariables = request.PromptVariables != null
                ? new Dictionary<string, string>(request.PromptVariables, StringComparer.OrdinalIgnoreCase)
                : new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            // Pass through the raw user message as a convenience variable
            if (!providedVariables.ContainsKey("user_input") && !string.IsNullOrWhiteSpace(request.Message))
            {
                providedVariables["user_input"] = request.Message;
            }

            var definedVariables = DeserializePromptVariables(prompt.VariablesJson);
            ValidatePromptVariables(definedVariables, providedVariables);

            request.Message = RenderPrompt(prompt.Content, providedVariables);
        }

        return request;
    }

    private static PersonaParametersDto DeserializePersonaParameters(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new PersonaParametersDto();
        try
        {
            return JsonSerializer.Deserialize<PersonaParametersDto>(json) ?? new PersonaParametersDto();
        }
        catch
        {
            return new PersonaParametersDto();
        }
    }

    private static List<PromptVariableDto> DeserializePromptVariables(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new List<PromptVariableDto>();
        try
        {
            return JsonSerializer.Deserialize<List<PromptVariableDto>>(json) ?? new List<PromptVariableDto>();
        }
        catch
        {
            return new List<PromptVariableDto>();
        }
    }

    private static void ValidatePromptVariables(IEnumerable<PromptVariableDto> defined, IReadOnlyDictionary<string, string> provided)
    {
        var missing = defined
            .Where(v => v.Required)
            .Where(v => !provided.ContainsKey(v.Name) || string.IsNullOrWhiteSpace(provided[v.Name]))
            .Select(v => v.Name)
            .ToList();

        if (missing.Count > 0)
        {
            throw new ApiException(
                $"Missing required variables: {string.Join(", ", missing)}",
                HttpStatusCode.BadRequest);
        }
    }

    private static string RenderPrompt(string template, IReadOnlyDictionary<string, string> variables)
    {
        if (string.IsNullOrWhiteSpace(template)) return string.Empty;

        var regex = new Regex(@"{{\s*(\w+)\s*}}", RegexOptions.Compiled);
        return regex.Replace(template, match =>
        {
            var key = match.Groups[1].Value;
            return variables.TryGetValue(key, out var value) ? value : match.Value;
        });
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
        StringBuilder assistantResponse, List<StreamedImageData> streamedImages, string model, ProviderType providerType, UsageData? usageData, string finishReason = "complete")
    {
        if (assistantResponse.Length == 0 && !streamedImages.Any())
        {
            if (finishReason == "cancelled")
            {
                assistantResponse.Append("[Cancelled]");
            }
            else
            {
                throw new ApiException("Provider returned no content.", HttpStatusCode.BadGateway);
            }
        }

        var content = assistantResponse.ToString();

        var assistantMessage = new Message
        {
            Role = "assistant",
            Content = content,
            Provider = providerType,
            Model = model,
            ParentMessageId = userMessage.MessageId,
            TokenCount = usageData?.CompletionTokens ?? 0,
            FinishReason = finishReason,
            ConversationId = conversation.Id,
            HasImages = streamedImages.Any()
        };

        // Save streamed images as files (or keep remote URLs)
        if (streamedImages.Any())
        {
            var savedImages = new List<MessageImageDto>();

            foreach (var imageData in streamedImages)
            {
                try
                {
                    var base64Data = imageData.Url;
                    string mimeType = "image/png";
                    var isDataUrl = base64Data.StartsWith("data:image/");

                    if (isDataUrl)
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

                    if (isDataUrl)
                    {
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
                    else
                    {
                        // Non-data URLs (e.g., provider-hosted URLs). Keep as-is so the client can render.
                        savedImages.Add(new MessageImageDto
                        {
                            Name = $"Generated Image {imageData.Index + 1}",
                            Url = imageData.Url,
                            MimeType = null
                        });
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to process streamed image {index}: {message}", imageData.Index, ex.Message);
                }
            }

            if (savedImages.Any())
            {
                assistantMessage.ToolCallsJson = JsonSerializer.Serialize(savedImages, new JsonSerializerOptions 
                { 
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase 
                });
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