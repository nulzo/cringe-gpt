using OllamaWebuiBackend.Enums;

namespace OllamaWebuiBackend.DTOs;

public class ImageGenerationRequestDto
{
    public ProviderType Provider { get; set; }
    public required string Prompt { get; set; }
    public string? Model { get; set; }
    public int N { get; set; } = 1;
    public string? Quality { get; set; } = "standard";
    public string? ResponseFormat { get; set; } = "url";
    public string? Size { get; set; } = "1024x1024";
    public string? Style { get; set; } = "vivid";
    public string? ConversationId { get; set; }

    // gpt-image-1 specific options
    public string? Background { get; set; } = "opaque"; // "opaque" or "transparent"
    public string? OutputFormat { get; set; } = "png"; // "png", "jpeg", "webp"
    public int? OutputCompression { get; set; } // 0-100 for jpeg/webp
    public string? InputFidelity { get; set; } = "low"; // "low" or "high"
    public string? Moderation { get; set; } = "auto"; // "auto" or "low"
}

public class ImageGenerationResponseDto
{
    public string? AssistantMessageContent { get; set; }
    public string? ConversationId { get; set; }
}

public class ImageDto
{
    public int Id { get; set; }
    public required string Url { get; set; }
    public required string Prompt { get; set; }
    public int UserId { get; set; }
}
