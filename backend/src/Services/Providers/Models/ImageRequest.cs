namespace OllamaWebuiBackend.Services.Providers.Models;

public class ImageRequest
{
    public required string Prompt { get; set; }
    public string? Model { get; set; } = "dall-e-3";
    public int N { get; set; } = 1;
    public string? Quality { get; set; } = "standard";
    public string? Size { get; set; } = "1024x1024";
}
