namespace OllamaWebuiBackend.Services.Interfaces;

public interface INotificationService
{
    Task NotifyConversationCompletedAsync(int userId, int conversationId, Guid messageId, CancellationToken cancellationToken = default);
}


