using OllamaWebuiBackend.DTOs;

namespace OllamaWebuiBackend.Services.Interfaces;

public interface ISseService
{
    Task ExecuteStreamAsync(IAsyncEnumerable<StreamEvent> stream, CancellationToken cancellationToken);
}
