namespace OllamaWebuiBackend.Services.Providers.Models;

public class UsageData
{
    public int PromptTokens { get; set; }
    public int CompletionTokens { get; set; }
    public decimal? ActualCost { get; set; } // Actual cost from provider (when available)
}

public class StreamedImageData
{
    public string Type { get; set; } = "image_url";
    public string Url { get; set; } = string.Empty;
    public int Index { get; set; }
}

public class StreamedContentChunk
{
    public string? TextContent { get; set; }
    public List<StreamedImageData>? Images { get; set; }
}

public class StreamedChatResponse
{
    public required IAsyncEnumerable<StreamedContentChunk> ContentStream { get; init; }
    public required Func<Task<UsageData>> GetUsageDataAsync { get; init; }
    public Task<string?>? FinishReason { get; init; }
}