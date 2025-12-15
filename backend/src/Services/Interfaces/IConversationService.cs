using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Enums;
using OllamaWebuiBackend.Models;

namespace OllamaWebuiBackend.Services.Interfaces;

public interface IConversationService
{
    Task<IEnumerable<ConversationSummaryDto>> GetAllSummariesAsync(int userId);
    Task<IEnumerable<ConversationSummaryDto>> GetPinnedConversationsAsync(int userId);
    Task<ConversationDetailDto?> GetByIdAsync(int conversationId, int userId);
    Task<Conversation> GetFullConversationAsync(int conversationId, int userId);
    Task<Conversation> CreateConversationAsync(int userId, Message userMessage, string title, ProviderType provider);
    Task<Conversation> UpdateAsync(int conversationId, int userId, ConversationUpdateDto updateDto);

    Task<Message> AddMessageAsync(int conversationId, int userId, string role, string content, ProviderType? provider,
        string? model, Guid? parentMessageId, int? tokenCount, string? finishReason);

    Task DeleteAsync(int conversationId, int userId);
    Task DeleteManyAsync(int userId, IEnumerable<int> conversationIds);

    // Conversation Analytics Methods
    Task<IEnumerable<ConversationAnalyticsDto>> GetConversationAnalyticsAsync(int userId, DateTime? from = null, DateTime? to = null);
    Task<ConversationAnalyticsSummaryDto> GetConversationAnalyticsSummaryAsync(int userId, DateTime? from = null, DateTime? to = null);
    Task<IEnumerable<ConversationPatternDto>> GetConversationPatternsAsync(int userId, DateTime? from = null, DateTime? to = null);
    Task<ConversationInsightsDto> GetConversationInsightsAsync(int userId, int topCount = 10, DateTime? from = null, DateTime? to = null);
    Task<ConversationAnalyticsDto?> GetConversationAnalyticsByIdAsync(int conversationId, int userId);

    Task<ConversationSearchResponseDto> SearchAsync(int userId, string query, string? cursor = null, int pageSize = 20);
}
