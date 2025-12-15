using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Models;

namespace OllamaWebuiBackend.Services.Interfaces;

public interface IChatService
{
    IAsyncEnumerable<StreamEvent> GetCompletionStreamAsync(int userId, ChatRequestDto request,
        CancellationToken cancellationToken);

    Task<Message> GetCompletionAsync(int userId, ChatRequestDto request, CancellationToken cancellationToken);
}
