using OllamaWebuiBackend.Common;
using OllamaWebuiBackend.Models;
using OllamaWebuiBackend.Services.Providers.Models;

namespace OllamaWebuiBackend.DTOs;

public abstract class StreamEvent
{
    public abstract string Event { get; }
}

public class ConversationChunkStreamEvent : StreamEvent
{
    public override string Event => Constants.SseEvents.ConversationId;
    public string Data { get; set; } = string.Empty;
}

public class ContentStreamEvent : StreamEvent
{
    public override string Event => Constants.SseEvents.Content;
    public string Data { get; set; } = string.Empty;
}

public class ImageStreamEvent : StreamEvent
{
    public override string Event => Constants.SseEvents.Image;
    public StreamedImageData Data { get; set; } = null!;
}

public class MetricsStreamEvent : StreamEvent
{
    public override string Event => Constants.SseEvents.Metrics;
    public UsageMetric Data { get; set; } = null!;
}

public class FinalMessageStreamEvent : StreamEvent
{
    public override string Event => Constants.SseEvents.FinalMessage;
    public Message Data { get; set; } = null!;
}

public class ErrorStreamEvent : StreamEvent
{
    public override string Event => Constants.SseEvents.Error;
    public object Data { get; set; } = null!;
}
