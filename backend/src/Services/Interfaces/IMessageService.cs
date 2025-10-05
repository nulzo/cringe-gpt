using OllamaWebuiBackend.DTOs;

namespace OllamaWebuiBackend.Services.Interfaces;

public interface IMessageService
{
    Task<MessageDto> UpdateLikeStatusAsync(Guid messageId, int userId, bool isLiked);
    Task<MessageDetailsDto> GetMessageDetailsAsync(Guid messageId, int userId);
    Task<MessageStatsDto> GetMessageStatsAsync(int userId);
    Task<IEnumerable<MessageDto>> GetLikedMessagesAsync(int userId, int? page = null, int? pageSize = null);
}
