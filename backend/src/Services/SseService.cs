using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using OllamaWebuiBackend.Common;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Services;

public class SseService : ISseService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly JsonSerializerOptions _jsonSerializerOptions;
    private readonly ILogger<SseService> _logger;

    public SseService(IHttpContextAccessor httpContextAccessor, ILogger<SseService> logger,
        IOptions<JsonOptions> jsonOptions)
    {
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
        _jsonSerializerOptions = jsonOptions.Value.JsonSerializerOptions;
    }

    private HttpResponse Response => _httpContextAccessor.HttpContext!.Response;

    public async Task ExecuteStreamAsync(IAsyncEnumerable<StreamEvent> stream, CancellationToken cancellationToken)
    {
        SetupSseHeaders();

        try
        {
            await foreach (var sseEvent in stream.WithCancellation(cancellationToken))
                await WriteSseEventAsync(sseEvent, cancellationToken);
        }
        catch (Exception ex)
        {
            await HandleStreamException(ex);
        }
    }

    private void SetupSseHeaders()
    {
        Response.ContentType = Constants.MimeTypes.TextEventStream;
        Response.Headers.CacheControl = Constants.HeaderValues.NoCache;
        Response.Headers.Connection = Constants.HeaderValues.KeepAlive;
    }

    private async Task WriteSseEventAsync(StreamEvent sseEvent, CancellationToken cancellationToken)
    {
        if (cancellationToken.IsCancellationRequested) return;

        var data = sseEvent switch
        {
            ContentStreamEvent contentEvent => contentEvent.Data,
            ImageStreamEvent imageEvent => imageEvent.Data,
            MetricsStreamEvent metricsEvent => metricsEvent.Data,
            FinalMessageStreamEvent finalMessageEvent => finalMessageEvent.Data,
            ErrorStreamEvent errorEvent => errorEvent.Data,
            ConversationChunkStreamEvent conversationChunkEvent => conversationChunkEvent.Data,
            _ => null
        };

        if (data is null)
        {
            _logger.LogWarning("Unknown or null data for stream event type: {type}", sseEvent.GetType().Name);
            return;
        }

        try
        {
            var serializedData = JsonSerializer.Serialize(data, _jsonSerializerOptions);
            var formattedMessage = $"event: {sseEvent.Event}\ndata: {serializedData}\n\n";

            await Response.WriteAsync(formattedMessage, Encoding.UTF8, cancellationToken);
            await Response.Body.FlushAsync(cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Failed to write SSE event of type {EventType}", sseEvent.GetType().Name);
            // Don't rethrow to avoid breaking the entire stream for one bad event
        }
    }

    private async Task HandleStreamException(Exception ex)
    {
        if (ex is OperationCanceledException)
        {
            _logger.LogInformation("Request was cancelled by the client.");
            // Client is gone, no need to write a response
            return;
        }

        ErrorStreamEvent errorEvent;
        if (ex is ApiException apiException)
        {
            _logger.LogError(ex, "API error during chat stream: {Message}", ex.Message);
            if (!Response.HasStarted)
                Response.StatusCode = (int)apiException.StatusCode;
            errorEvent = new ErrorStreamEvent { Data = new { apiException.Message } };
        }
        else
        {
            _logger.LogError(ex, "An unexpected error occurred during the chat stream.");
            if (!Response.HasStarted) Response.StatusCode = 500;
            errorEvent = new ErrorStreamEvent { Data = new { Message = "An unexpected error occurred." } };
        }

        // Use CancellationToken.None because the original token may be cancelled
        await WriteSseEventAsync(errorEvent, CancellationToken.None);
    }
}
