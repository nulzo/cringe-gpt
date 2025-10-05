using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace OllamaWebuiBackend.SignalR;

[Authorize]
public class NotificationsHub : Hub
{
}


