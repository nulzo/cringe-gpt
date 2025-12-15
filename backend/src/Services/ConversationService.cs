using System.Linq;
using System.Net;
using AutoMapper;
using OllamaWebuiBackend.Common;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Enums;
using OllamaWebuiBackend.Models;
using OllamaWebuiBackend.Repositories.Interfaces;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Services;

public class ConversationService : IConversationService
{
    private readonly IConversationRepository _conversationRepository;
    private readonly IMapper _mapper;
    private readonly IFileService _fileService;
    private readonly ITagRepository _tagRepository;

    public ConversationService(IConversationRepository conversationRepository, IMapper mapper, IFileService fileService, ITagRepository tagRepository)
    {
        _conversationRepository = conversationRepository;
        _mapper = mapper;
        _fileService = fileService;
        _tagRepository = tagRepository;
    }

    public async Task<IEnumerable<ConversationSummaryDto>> GetAllSummariesAsync(int userId)
    {
        var conversations = await _conversationRepository.GetAllSummariesForUserAsync(userId);
        return _mapper.Map<IEnumerable<ConversationSummaryDto>>(conversations);
    }

    public async Task<IEnumerable<ConversationSummaryDto>> GetPinnedConversationsAsync(int userId)
    {
        var pinnedConversations = await _conversationRepository.GetPinnedConversationsForUserAsync(userId);
        return _mapper.Map<IEnumerable<ConversationSummaryDto>>(pinnedConversations);
    }

    public async Task<ConversationDetailDto?> GetByIdAsync(int conversationId, int userId)
    {
        var conversation = await _conversationRepository.GetByIdWithMessagesAsync(conversationId, userId);
        if (conversation == null) return null;

        // Load messages with images
        foreach (var message in conversation.Messages)
        {
            if (message.HasImages && !string.IsNullOrEmpty(message.ToolCallsJson))
            {
                try
                {
                    var fileIds = System.Text.Json.JsonSerializer.Deserialize<List<int>>(message.ToolCallsJson);
                    var images = new List<MessageImageDto>();

                    if (fileIds != null)
                    {
                        foreach (var fileId in fileIds)
                        {
                            var file = await _fileService.GetFileAsync(fileId, userId);
                            if (file != null)
                            {
                                images.Add(new MessageImageDto
                                {
                                    Id = file.Id,
                                    Name = file.Name,
                                    Url = $"/api/v1/files/{file.Id}",
                                    MimeType = file.MimeType
                                });
                            }
                        }
                    }

                    // Update the ToolCallsJson with the actual image information
                    message.ToolCallsJson = System.Text.Json.JsonSerializer.Serialize(images);
                }
                catch
                {
                    // Handle error gracefully
                }
            }
        }

        var dto = _mapper.Map<ConversationDetailDto>(conversation);
        dto.Messages = dto.Messages.OrderBy(m => m.CreatedAt).ToList();
        return dto;
    }

    public async Task<Conversation> GetFullConversationAsync(int conversationId, int userId)
    {
        var conversation = await _conversationRepository.GetTrackedByIdWithMessagesAsync(conversationId, userId);
        if (conversation == null || conversation.UserId != userId)
            throw new ApiException("Conversation not found", HttpStatusCode.NotFound);

        // Load messages with images
        foreach (var message in conversation.Messages)
        {
            if (message.HasImages && !string.IsNullOrEmpty(message.ToolCallsJson))
            {
                try
                {
                    var fileIds = System.Text.Json.JsonSerializer.Deserialize<List<int>>(message.ToolCallsJson);
                    var images = new List<MessageImageDto>();

                    if (fileIds != null)
                    {
                        foreach (var fileId in fileIds)
                        {
                            var file = await _fileService.GetFileAsync(fileId, userId);
                            if (file != null)
                            {
                                images.Add(new MessageImageDto
                                {
                                    Id = file.Id,
                                    Name = file.Name,
                                    Url = $"/api/v1/files/{file.Id}",
                                    MimeType = file.MimeType
                                });
                            }
                        }
                    }

                    // Update the ToolCallsJson with the actual image information
                    message.ToolCallsJson = System.Text.Json.JsonSerializer.Serialize(images);
                }
                catch
                {
                    // Handle error gracefully
                }
            }
        }

        return conversation;
    }

    public async Task<Conversation> CreateConversationAsync(int userId, Message userMessage, string title,
        ProviderType provider)
    {
        var conversation = Conversation.Create(userId, title, provider);
        conversation.AddMessage(userMessage);

        await _conversationRepository.AddAsync(conversation);
        await _conversationRepository.SaveChangesAsync();

        return conversation;
    }

    public async Task<Conversation> UpdateAsync(int conversationId, int userId, ConversationUpdateDto updateDto)
    {
        var conversation = await _conversationRepository.GetTrackedByIdAsync(conversationId, userId);

        if (conversation == null)
            throw new ApiException("Conversation not found.", HttpStatusCode.NotFound);

        if (updateDto.Title != null)
            conversation.Title = updateDto.Title;
        if (updateDto.IsPinned.HasValue)
            conversation.IsPinned = updateDto.IsPinned.Value;
        if (updateDto.IsHidden.HasValue)
            conversation.IsHidden = updateDto.IsHidden.Value;
        if (updateDto.Tags != null)
        {
            var tagNames = updateDto.Tags
                .Where(t => !string.IsNullOrWhiteSpace(t))
                .Select(t => t.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            var tags = await _tagRepository.GetOrCreateTagsAsync(tagNames);
            conversation.Tags.Clear();
            foreach (var tag in tags)
            {
                conversation.Tags.Add(tag);
            }
        }

        _conversationRepository.Update(conversation);
        await _conversationRepository.SaveChangesAsync();
        return conversation;
    }

    public async Task<Message> AddMessageAsync(int conversationId, int userId, string role, string content,
        ProviderType? provider, string? model, Guid? parentMessageId, int? tokenCount, string? finishReason)
    {
        var conversation = await _conversationRepository.GetTrackedByIdWithMessagesAsync(conversationId, userId);

        if (conversation == null)
            throw new ApiException("Conversation not found.", HttpStatusCode.NotFound);

        var message = conversation.AddMessage(role, content, provider, model, parentMessageId, tokenCount, finishReason);
        await _conversationRepository.SaveChangesAsync();

        return message;
    }

    public async Task DeleteAsync(int conversationId, int userId)
    {
        var conversation = await _conversationRepository.GetTrackedByIdAsync(conversationId, userId);

        if (conversation != null)
        {
            _conversationRepository.Delete(conversation);
            await _conversationRepository.SaveChangesAsync();
        }
    }

    public async Task DeleteManyAsync(int userId, IEnumerable<int> conversationIds)
    {
        await _conversationRepository.DeleteManyAsync(userId, conversationIds);
        await _conversationRepository.SaveChangesAsync();
    }

    private async Task PopulateGeneratedImages(Message message, int userId)
    {
        if (message.HasImages && !string.IsNullOrEmpty(message.Content))
        {
            // Check if the content contains image references like ![filename](/api/v1/files/id)
            var imageMatches = System.Text.RegularExpressions.Regex.Matches(message.Content, @"!\[([^\]]+)\]\(/api/v1/files/(\d+)\)");

            if (imageMatches.Count > 0)
            {
                var images = new List<MessageImageDto>();
                var fileIds = new List<int>();

                foreach (System.Text.RegularExpressions.Match match in imageMatches)
                {
                    var fileName = match.Groups[1].Value;
                    var fileId = int.Parse(match.Groups[2].Value);

                    var file = await _fileService.GetFileAsync(fileId, userId);
                    if (file != null)
                    {
                        images.Add(new MessageImageDto
                        {
                            Id = file.Id,
                            Name = file.Name,
                            Url = $"/api/v1/files/{file.Id}",
                            MimeType = file.MimeType
                        });
                        fileIds.Add(file.Id);
                    }
                }

                // Store the image information
                message.ToolCallsJson = System.Text.Json.JsonSerializer.Serialize(images);
            }
        }
    }

    // Conversation Analytics Methods Implementation

    public async Task<IEnumerable<ConversationAnalyticsDto>> GetConversationAnalyticsAsync(int userId, DateTime? from = null, DateTime? to = null)
    {
        return await _conversationRepository.GetConversationAnalyticsAsync(userId, from, to);
    }

    public async Task<ConversationAnalyticsSummaryDto> GetConversationAnalyticsSummaryAsync(int userId, DateTime? from = null, DateTime? to = null)
    {
        return await _conversationRepository.GetConversationAnalyticsSummaryAsync(userId, from, to);
    }

    public async Task<IEnumerable<ConversationPatternDto>> GetConversationPatternsAsync(int userId, DateTime? from = null, DateTime? to = null)
    {
        return await _conversationRepository.GetConversationPatternsAsync(userId, from, to);
    }

    public async Task<ConversationInsightsDto> GetConversationInsightsAsync(int userId, int topCount = 10, DateTime? from = null, DateTime? to = null)
    {
        return await _conversationRepository.GetConversationInsightsAsync(userId, topCount, from, to);
    }

    public async Task<ConversationAnalyticsDto?> GetConversationAnalyticsByIdAsync(int conversationId, int userId)
    {
        var conversation = await _conversationRepository.GetByIdWithMessagesAsync(conversationId, userId);
        if (conversation == null) return null;

        var usageMetrics = await GetUsageMetricsForConversationAsync(conversationId, userId);
        return BuildConversationAnalyticsDto(conversation, usageMetrics);
    }

    public async Task<ConversationSearchResponseDto> SearchAsync(int userId, string query, string? cursor = null, int pageSize = 20)
    {
        var (tuples, nextCursor) = await _conversationRepository.SearchAsync(userId, query, cursor, pageSize);

        var items = tuples.Select(t => new ConversationSearchItemDto
        {
            Id = t.conversation.Id,
            ConversationId = t.conversation.ConversationId,
            CurrentNodeId = t.conversation.Messages.OrderByDescending(m => m.CreatedAt).FirstOrDefault()?.MessageId,
            Title = t.conversation.Title,
            IsArchived = t.conversation.IsHidden,
            IsStarred = t.conversation.IsPinned,
            UpdateTime = t.conversation.UpdatedAt.Subtract(DateTime.UnixEpoch).TotalSeconds,
            Payload = new ConversationSearchPayloadDto
            {
                Kind = "message",
                MessageId = t.message?.MessageId,
                Snippet = BuildSnippet(t.message?.Content ?? string.Empty, query)
            }
        }).ToList();

        return new ConversationSearchResponseDto
        {
            Items = items,
            Cursor = nextCursor
        };
    }

    private static string BuildSnippet(string content, string query, int maxLength = 220)
    {
        if (string.IsNullOrEmpty(content)) return string.Empty;
        if (string.IsNullOrWhiteSpace(query))
            return content.Length <= maxLength ? content : content[..maxLength];

        var idx = content.IndexOf(query, StringComparison.OrdinalIgnoreCase);
        if (idx < 0) return content.Length <= maxLength ? content : content[..maxLength];

        var start = Math.Max(0, idx - maxLength / 3);
        var end = Math.Min(content.Length, start + maxLength);
        var snippet = content.Substring(start, end - start);
        if (start > 0) snippet = "…" + snippet;
        if (end < content.Length) snippet += "…";
        return snippet;
    }

    private async Task<List<UsageMetric>> GetUsageMetricsForConversationAsync(int conversationId, int userId)
    {
        // This would typically come from the MetricsRepository, but for now we'll use a simple approach
        // In a real implementation, you'd inject IMetricsRepository and call a method to get usage metrics by conversation
        return new List<UsageMetric>(); // Placeholder - would need proper implementation
    }

    private ConversationAnalyticsDto BuildConversationAnalyticsDto(Conversation conversation, List<UsageMetric> usageMetrics)
    {
        // This is a simplified version - in practice you'd want to reuse the repository's implementation
        var messages = conversation.Messages.OrderBy(m => m.CreatedAt).ToList();
        var userMessages = messages.Where(m => m.Role == "user").ToList();
        var assistantMessages = messages.Where(m => m.Role == "assistant").ToList();

        var duration = messages.Any()
            ? messages.Last().CreatedAt - messages.First().CreatedAt
            : TimeSpan.Zero;

        var errorMessages = messages.Where(m => m.IsError || m.Error != null).ToList();

        var totalTokens = usageMetrics.Sum(um => um.PromptTokens + um.CompletionTokens);
        var totalCost = usageMetrics.Sum(um => um.CostInUSD);

        return new ConversationAnalyticsDto
        {
            ConversationId = conversation.Id,
            Title = conversation.Title,
            CreatedAt = conversation.CreatedAt,
            UpdatedAt = conversation.UpdatedAt,
            Provider = conversation.Provider,
            CompletionMetrics = new ConversationCompletionMetrics
            {
                TotalMessages = messages.Count,
                UserMessages = userMessages.Count,
                AssistantMessages = assistantMessages.Count,
                IsCompleted = assistantMessages.Any(),
                CompletionReason = assistantMessages.LastOrDefault()?.FinishReason
            },
            EngagementMetrics = new ConversationEngagementMetrics
            {
                Duration = duration,
                MessageFrequency = duration.TotalMinutes > 0 ? (int)(messages.Count / duration.TotalMinutes) : 0,
                AverageResponseTime = TimeSpan.Zero, // Simplified
                PeakActivityHour = conversation.CreatedAt.Hour,
                SessionLengthScore = 0.5 // Simplified
            },
            QualityMetrics = new ConversationQualityMetrics
            {
                AverageMessageLength = messages.Any() ? messages.Average(m => m.Content.Length) : 0,
                TotalTokensUsed = totalTokens,
                HasErrors = errorMessages.Any(),
                ErrorCount = errorMessages.Count,
                HasImages = messages.Any(m => m.HasImages),
                HasToolCalls = messages.Any(m => m.HasToolCalls),
                HasCitations = messages.Any(m => m.HasCitations)
            },
            CostMetrics = new ConversationCostMetrics
            {
                TotalCost = totalCost,
                AverageCostPerMessage = messages.Count > 0 ? totalCost / messages.Count : 0,
                CostPerToken = totalTokens > 0 ? totalCost / totalTokens : 0,
                TotalTokens = totalTokens,
                MostExpensiveModel = usageMetrics.OrderByDescending(um => um.CostInUSD).FirstOrDefault()?.Model
            }
        };
    }
}
