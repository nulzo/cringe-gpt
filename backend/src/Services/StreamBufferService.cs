using System.Runtime.CompilerServices;
using System.Text;
using Microsoft.Extensions.Options;
using OllamaWebuiBackend.Common;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Services;

public class StreamBufferService : IStreamBufferService
{
    private readonly ILogger<StreamBufferService> _logger;
    private readonly StreamingConfig _config;

    public StreamBufferService(ILogger<StreamBufferService> logger, IOptions<StreamingConfig> config)
    {
        _logger = logger;
        _config = config.Value;
    }

    public async IAsyncEnumerable<string> CreateSmoothStreamAsync(
        IAsyncEnumerable<string> inputStream,
        int targetChunkSize = 0,
        int targetIntervalMs = 0,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        // Use config values if parameters are not specified
        var effectiveChunkSize = targetChunkSize > 0 ? targetChunkSize : _config.TargetChunkSize;
        var effectiveIntervalMs = targetIntervalMs > 0 ? targetIntervalMs : _config.TargetIntervalMs;

        _logger.LogDebug("Starting character-by-character stream with chunk size: {ChunkSize}, interval: {IntervalMs}ms",
            effectiveChunkSize, effectiveIntervalMs);

        var inputEnumerator = inputStream.GetAsyncEnumerator(cancellationToken);
        var characterBuffer = new Queue<char>();
        var emitBuffer = new StringBuilder();
        var lastEmitTime = DateTime.UtcNow;

        try
        {
            // Process input stream character by character for smooth streaming
            await foreach (var inputChunk in inputStream.WithCancellation(cancellationToken))
            {
                // Add each character to the buffer individually for precise control
                foreach (var character in inputChunk)
                {
                    characterBuffer.Enqueue(character);

                    // Emit characters based on adaptive timing and chunk size
                    while (ShouldEmitCharacter(characterBuffer.Count, effectiveChunkSize, lastEmitTime, effectiveIntervalMs))
                    {
                        if (characterBuffer.Count == 0) break;

                        var characterToEmit = characterBuffer.Dequeue();
                        emitBuffer.Append(characterToEmit);

                        // Emit when we have accumulated enough characters or it's been too long
                        if (emitBuffer.Length >= effectiveChunkSize ||
                            (emitBuffer.Length > 0 && GetTimeSinceLastEmit(lastEmitTime) > effectiveIntervalMs * 2))
                        {
                            var chunkToEmit = emitBuffer.ToString();
                            emitBuffer.Clear();

                            yield return chunkToEmit;
                            lastEmitTime = DateTime.UtcNow;

                            // Adaptive delay based on content type
                            var delay = CalculateAdaptiveDelay(chunkToEmit, effectiveIntervalMs);
                            if (delay > 0)
                            {
                                await Task.Delay(delay, cancellationToken);
                            }
                        }
                    }
                }
            }

            // Emit any remaining buffered characters
            while (characterBuffer.Count > 0 || emitBuffer.Length > 0)
            {
                if (emitBuffer.Length == 0 && characterBuffer.Count > 0)
                {
                    // Move remaining characters to emit buffer
                    while (characterBuffer.Count > 0 && emitBuffer.Length < effectiveChunkSize)
                    {
                        emitBuffer.Append(characterBuffer.Dequeue());
                    }
                }

                if (emitBuffer.Length > 0)
                {
                    var chunkToEmit = emitBuffer.ToString();
                    emitBuffer.Clear();

                    yield return chunkToEmit;
                    lastEmitTime = DateTime.UtcNow;

                    // Shorter delay for remaining content
                    if (effectiveIntervalMs > 0)
                    {
                        await Task.Delay(Math.Max(1, effectiveIntervalMs / 4), cancellationToken);
                    }
                }
            }
        }
        finally
        {
            await inputEnumerator.DisposeAsync();
        }
    }

    private bool ShouldEmitCharacter(int bufferSize, int targetChunkSize, DateTime lastEmitTime, int targetIntervalMs)
    {
        // Emit if buffer is getting too large
        if (bufferSize >= targetChunkSize * 2) return true;

        // Emit if too much time has passed since last emission
        if (GetTimeSinceLastEmit(lastEmitTime) > targetIntervalMs) return true;

        return false;
    }

    private int GetTimeSinceLastEmit(DateTime lastEmitTime)
    {
        return (int)(DateTime.UtcNow - lastEmitTime).TotalMilliseconds;
    }

    private int CalculateAdaptiveDelay(string chunk, int baseIntervalMs)
    {
        if (string.IsNullOrEmpty(chunk) || baseIntervalMs <= 0) return baseIntervalMs;

        // Slow down for punctuation to create natural pauses
        if (chunk.Contains('.') || chunk.Contains('!') || chunk.Contains('?') || chunk.Contains('\n'))
        {
            return baseIntervalMs * 3; // 3x slower for sentence endings
        }

        // Slightly slower for commas and other punctuation
        if (chunk.Contains(',') || chunk.Contains(';') || chunk.Contains(':'))
        {
            return (int)(baseIntervalMs * 1.5); // 1.5x slower for pauses
        }

        // Normal speed for regular text
        return baseIntervalMs;
    }
}