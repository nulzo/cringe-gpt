using Microsoft.EntityFrameworkCore;
using OllamaWebuiBackend.Data;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Models;
using OllamaWebuiBackend.Repositories.Interfaces;

namespace OllamaWebuiBackend.Repositories;

public class MessageRepository : GenericRepository<Message>, IMessageRepository
{
    private new readonly AppDbContext _context;

    public MessageRepository(AppDbContext context) : base(context)
    {
        _context = context;
    }

    public async Task<Message?> GetByMessageIdAsync(Guid messageId, int userId)
    {
        return await _context.Messages
            .Include(m => m.Conversation)
            .Include(m => m.Attachments)
            .Include(m => m.Error)
            .FirstOrDefaultAsync(m =>
                m.MessageId == messageId &&
                m.Conversation.UserId == userId);
    }

    public async Task<IEnumerable<Message>> GetMessagesByConversationAsync(int conversationId, int userId)
    {
        return await _context.Messages
            .Include(m => m.Attachments)
            .Include(m => m.Error)
            .Where(m =>
                m.ConversationId == conversationId &&
                m.Conversation.UserId == userId)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Message>> GetLikedMessagesAsync(int userId, int? page = null, int? pageSize = null)
    {
        var query = _context.Messages
            .Include(m => m.Conversation)
            .Include(m => m.Attachments)
            .Include(m => m.Error)
            .Where(m => m.Conversation.UserId == userId && m.IsLiked)
            .OrderByDescending(m => m.CreatedAt);

        if (page.HasValue && pageSize.HasValue)
        {
            query = (IOrderedQueryable<Message>)query
                .Skip((page.Value - 1) * pageSize.Value)
                .Take(pageSize.Value);
        }

        return await query.ToListAsync();
    }

    public async Task UpdateLikeStatusAsync(Guid messageId, int userId, bool isLiked)
    {
        var message = await GetByMessageIdAsync(messageId, userId);
        if (message != null)
        {
            message.IsLiked = isLiked;
            message.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    public async Task<MessageStatsDto> GetMessageStatsAsync(int userId)
    {
        var messages = await _context.Messages
            .Include(m => m.Conversation)
            .Where(m => m.Conversation.UserId == userId)
            .ToListAsync();

        var stats = new MessageStatsDto
        {
            TotalMessages = messages.Count,
            LikedMessages = messages.Count(m => m.IsLiked),
            AssistantMessages = messages.Count(m => m.Role == "assistant"),
            UserMessages = messages.Count(m => m.Role == "user"),
        };

        // Group by provider
        stats.MessagesByProvider = messages
            .Where(m => m.Provider.HasValue)
            .GroupBy(m => m.Provider.ToString()!)
            .ToDictionary(g => g.Key, g => g.Count());

        // Group by model
        stats.MessagesByModel = messages
            .Where(m => !string.IsNullOrEmpty(m.Model))
            .GroupBy(m => m.Model!)
            .ToDictionary(g => g.Key, g => g.Count());

        return stats;
    }

    private List<MessageImageDto> MapMessageImages(Message message)
    {
        var images = new List<MessageImageDto>();

        if (message.HasImages && !string.IsNullOrEmpty(message.ToolCallsJson))
        {
            try
            {
                // First try to deserialize as MessageImageDto objects (processed by service)
                var processedImages = System.Text.Json.JsonSerializer.Deserialize<List<MessageImageDto>>(message.ToolCallsJson);
                if (processedImages != null && processedImages.Any())
                {
                    return processedImages;
                }

                // Fall back to deserializing as file IDs (original behavior)
                var fileIds = System.Text.Json.JsonSerializer.Deserialize<List<int>>(message.ToolCallsJson);
                if (fileIds != null && fileIds.Any())
                {
                    // Create MessageImageDto objects with file API URLs
                    foreach (var fileId in fileIds)
                    {
                        images.Add(new MessageImageDto
                        {
                            Id = fileId,
                            Name = $"Image {fileId}",
                            Url = $"/api/v1/files/{fileId}",
                            MimeType = "image/png" // Default, will be overridden by actual file type
                        });
                    }
                }
            }
            catch (Exception ex)
            {
                // Log error but don't fail - return empty list
                Console.WriteLine($"Error deserializing message images: {ex.Message}");
            }
        }

        return images;
    }

    public async Task<MessageDetailsDto> GetMessageDetailsAsync(Guid messageId, int userId)
    {
        var message = await _context.Messages
            .Include(m => m.Conversation)
            .Include(m => m.Attachments)
            .Include(m => m.Error)
            .FirstOrDefaultAsync(m =>
                m.MessageId == messageId &&
                m.Conversation.UserId == userId);

        if (message == null) return null!;

        // Calculate generation time if we have timestamps
        double? generationTime = null;
        if (message.CreatedAt != default && message.UpdatedAt != default && message.UpdatedAt > message.CreatedAt)
        {
            generationTime = (message.UpdatedAt - message.CreatedAt).TotalSeconds;
        }

        // Calculate cost (this would need to be implemented based on your pricing logic)
        decimal? totalCost = null;
        // TODO: Implement cost calculation based on tokens and pricing

        // Map images from ToolCallsJson
        var images = MapMessageImages(message);

        return new MessageDetailsDto
        {
            MessageId = message.MessageId,
            ParentMessageId = message.ParentMessageId,
            ConversationId = message.ConversationId,
            Role = message.Role,
            Content = message.Content,
            CreatedAt = message.CreatedAt,
            Provider = message.Provider?.ToString(),
            Model = message.Model,
            TokenCount = message.TokenCount,
            FinishReason = message.FinishReason,
            IsLiked = message.IsLiked,
            IsHidden = message.IsHidden,
            IsError = message.IsError,
            HasImages = message.HasImages,
            Images = images,
            HasCitations = message.HasCitations,
            HasToolCalls = message.HasToolCalls,
            GenerationTime = generationTime,
            TotalCost = totalCost,
            AttachmentCount = message.Attachments?.Count ?? 0
        };
    }
}
