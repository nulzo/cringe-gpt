using OllamaWebuiBackend.Models;
using OllamaWebuiBackend.DTOs;

namespace OllamaWebuiBackend.Repositories.Interfaces;

public interface IMessageRepository : IGenericRepository<Message>
{
    Task<Message?> GetByMessageIdAsync(Guid messageId, int userId);
    Task<IEnumerable<Message>> GetMessagesByConversationAsync(int conversationId, int userId);
    Task<IEnumerable<Message>> GetLikedMessagesAsync(int userId, int? page = null, int? pageSize = null);
    Task UpdateLikeStatusAsync(Guid messageId, int userId, bool isLiked);
    Task<MessageStatsDto> GetMessageStatsAsync(int userId);
    Task<MessageDetailsDto> GetMessageDetailsAsync(Guid messageId, int userId);
}
