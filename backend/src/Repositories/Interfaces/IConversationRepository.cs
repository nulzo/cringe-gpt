using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Models;

namespace OllamaWebuiBackend.Repositories.Interfaces;

public interface IConversationRepository : IGenericRepository<Conversation>
{
    Task<IEnumerable<Conversation>> GetAllSummariesForUserAsync(int userId);
    Task<IEnumerable<Conversation>> GetPinnedConversationsForUserAsync(int userId);
    Task<Conversation?> GetByIdWithMessagesAsync(int conversationId, int userId);
    Task<Conversation?> GetTrackedByIdWithMessagesAsync(int conversationId, int userId);
    Task<Conversation?> GetTrackedByIdAsync(int conversationId, int userId);
    Task DeleteManyAsync(int userId, IEnumerable<int> conversationIds);
    Task<Message?> GetLastMessageAsync(int conversationId);

    Task<(IEnumerable<(Conversation conversation, Message? message)>, string?)> SearchAsync(
        int userId,
        string query,
        string? cursor = null,
        int pageSize = 20);

    // Conversation Analytics Methods
    Task<IEnumerable<ConversationAnalyticsDto>> GetConversationAnalyticsAsync(int userId, DateTime? from = null, DateTime? to = null);
    Task<ConversationAnalyticsSummaryDto> GetConversationAnalyticsSummaryAsync(int userId, DateTime? from = null, DateTime? to = null);
    Task<IEnumerable<ConversationPatternDto>> GetConversationPatternsAsync(int userId, DateTime? from = null, DateTime? to = null);
    Task<ConversationInsightsDto> GetConversationInsightsAsync(int userId, int topCount = 10, DateTime? from = null, DateTime? to = null);
    Task<IEnumerable<Conversation>> GetConversationsWithAnalyticsAsync(int userId, DateTime? from = null, DateTime? to = null);
}