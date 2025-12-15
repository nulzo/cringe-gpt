#if DEBUG
using System.Runtime.CompilerServices;
using Microsoft.AspNetCore.Mvc;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Models;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Controllers.v1;

[ApiController]
[Route("api/v1/[controller]")]
public class StreamTestController(
    IStreamBufferService streamBufferService,
    ISseService sseService,
    ILogger<StreamTestController> logger) : ControllerBase
{
    private readonly IStreamBufferService _streamBufferService = streamBufferService;
    private readonly ISseService _sseService = sseService;
    private readonly ILogger<StreamTestController> _logger = logger;

    [HttpGet("smooth")]
    public async Task TestSmoothStreaming([FromQuery] string? text = null, [FromQuery] int chunkSize = 0, [FromQuery] int intervalMs = 0)
    {
        var testText = text ?? "This is a test of the smooth streaming functionality. " +
                              "It should demonstrate how the StreamBufferService creates consistent, " +
                              "ChatGPT-like streaming from irregular input chunks. " +
                              "The text will be broken down into small, timed chunks that create " +
                              "a smooth typing effect for the user experience.";

        var cancellationToken = HttpContext.RequestAborted;

        // Simulate irregular input chunks (like from AI providers)
        var irregularStream = CreateIrregularStream(testText, cancellationToken);

        // Create smooth stream
        var smoothStream = _streamBufferService.CreateSmoothStreamAsync(
            irregularStream,
            chunkSize,
            intervalMs,
            cancellationToken);

        // Convert to SSE events
        var sseStream = ConvertToSseEvents(smoothStream, cancellationToken);

        await _sseService.ExecuteStreamAsync(sseStream, cancellationToken);
    }

    private async IAsyncEnumerable<string> CreateIrregularStream(
        string text,
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        var random = new Random();
        var position = 0;

        while (position < text.Length && !cancellationToken.IsCancellationRequested)
        {
            // Simulate irregular chunk sizes (1-15 characters)
            var chunkSize = random.Next(1, 16);
            var actualChunkSize = Math.Min(chunkSize, text.Length - position);

            var chunk = text.AsSpan(position, actualChunkSize).ToString();
            position += actualChunkSize;

            // Simulate irregular timing (10-200ms delays)
            var delay = random.Next(10, 201);
            await Task.Delay(delay, cancellationToken);

            _logger.LogDebug("Irregular chunk: '{Chunk}' (size: {Size}, delay: {Delay}ms)",
                chunk, actualChunkSize, delay);

            yield return chunk;
        }
    }

    private static async IAsyncEnumerable<StreamEvent> ConvertToSseEvents(
        IAsyncEnumerable<string> smoothStream,
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        var fullContent = new System.Text.StringBuilder();

        await foreach (var chunk in smoothStream.WithCancellation(cancellationToken))
        {
            fullContent.Append(chunk);
            yield return new ContentStreamEvent { Data = chunk };
        }

        // Create a proper Message object for the final event
        var finalMessage = new Message
        {
            MessageId = Guid.NewGuid(),
            Role = "assistant",
            Content = fullContent.ToString(),
            ConversationId = 0, // Test conversation
            FinishReason = "complete"
        };

        yield return new FinalMessageStreamEvent { Data = finalMessage };
    }
}
#endif
