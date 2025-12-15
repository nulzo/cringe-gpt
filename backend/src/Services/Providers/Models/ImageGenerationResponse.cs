namespace OllamaWebuiBackend.Services.Providers.Models;

public class ImageGenerationResponse
{
    public required List<ImageData> Images { get; set; }
}

public class ImageData
{
    public string? Url { get; set; }
    public byte[]? Base64Data { get; set; }
    public string? RevisedPrompt { get; set; }
}
