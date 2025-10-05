namespace OllamaWebuiBackend.Services.Providers.Models;

public class ImageGenerationRequest
{
    public required string Prompt { get; set; }
    public string? Model { get; set; }
    public int N { get; set; } = 1;
    public string? Quality { get; set; } = "high";
    public string? ResponseFormat { get; set; } = "url";
    public string? Size { get; set; } = "1024x1024";
    public string? Style { get; set; } = "vivid";
    
    // gpt-image-1 specific options
    public string? Background { get; set; } = "opaque"; // "opaque" or "transparent"
    public string? OutputFormat { get; set; } = "png"; // "png", "jpeg", "webp"
    public int? OutputCompression { get; set; } // 0-100 for jpeg/webp
    public string? InputFidelity { get; set; } = "high"; // "low" or "high"
    public string? Moderation { get; set; } = "auto"; // "auto" or "low"
}

public class ImageEditRequest
{
    public required string Prompt { get; set; }
    public string? Model { get; set; } = "gpt-image-1";
    public List<byte[]>? ReferenceImages { get; set; } // For reference images
    public byte[]? Mask { get; set; } // For mask image
    public int N { get; set; } = 1;
    public string? Quality { get; set; } = "high";
    public string? Size { get; set; } = "1024x1024";
    public string? Style { get; set; } = "vivid";
    public string? Background { get; set; } // e.g., "transparent"
    public string? InputFidelity { get; set; } = "low"; // "low" or "high"
}