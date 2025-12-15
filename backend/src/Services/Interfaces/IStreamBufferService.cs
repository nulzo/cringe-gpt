namespace OllamaWebuiBackend.Services.Interfaces;

public interface IStreamBufferService
{
    /// <summary>
    /// Creates a smooth, consistent stream from an irregular input stream
    /// </summary>
    /// <param name="inputStream">The irregular input stream from providers</param>
    /// <param name="targetChunkSize">Target size for each output chunk (in characters)</param>
    /// <param name="targetIntervalMs">Target interval between chunks in milliseconds</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>A smooth, consistent stream of chunks</returns>
    IAsyncEnumerable<string> CreateSmoothStreamAsync(
        IAsyncEnumerable<string> inputStream,
        int targetChunkSize = 3,
        int targetIntervalMs = 5,
        CancellationToken cancellationToken = default);
}
