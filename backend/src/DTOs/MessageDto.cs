using OllamaWebuiBackend.Enums;

namespace OllamaWebuiBackend.DTOs;

public class MessageDto
{
    public int Id { get; set; }
    public Guid MessageId { get; set; }
    public Guid? ParentMessageId { get; set; }
    public required string Role { get; set; }
    public required string Content { get; set; }
    public DateTime CreatedAt { get; set; }
    public ProviderType? Provider { get; set; }
    public string? Model { get; set; }
    public int? TokenCount { get; set; }
    public bool IsLiked { get; set; }

    public List<MessageImageDto>? Images { get; set; } = new List<MessageImageDto>();

}


public class MessageImageDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
}