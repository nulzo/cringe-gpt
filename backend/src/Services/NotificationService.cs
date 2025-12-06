using Microsoft.AspNetCore.SignalR;
using OllamaWebuiBackend.Services.Interfaces;
using OllamaWebuiBackend.SignalR;

namespace OllamaWebuiBackend.Services;

public class NotificationService(IHubContext<NotificationsHub> hub) : INotificationService
{
    private readonly IHubContext<NotificationsHub> _hub = hub;

    public Task NotifyConversationCompletedAsync(int userId, int conversationId, Guid messageId, CancellationToken cancellationToken = default)
    {
        return SendNotificationAsync(userId, "conversationCompleted", new { conversationId, messageId }, cancellationToken);
    }

    public async Task SendNotificationAsync<T>(int userId, string method, T payload,
        CancellationToken cancellationToken = default)
    {
        await _hub.Clients.User(userId.ToString()).SendAsync(method, payload, cancellationToken);
    }
}


