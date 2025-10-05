namespace OllamaWebuiBackend.DTOs;

public class MessageDetailsDto
{
    public Guid MessageId { get; set; }
    public Guid? ParentMessageId { get; set; }
    public int ConversationId { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string? Provider { get; set; }
    public string? Model { get; set; }
    public int? TokenCount { get; set; }
    public string? FinishReason { get; set; }
    public bool IsLiked { get; set; }
    public bool IsHidden { get; set; }
    public bool IsError { get; set; }
    public bool HasImages { get; set; }
    public List<MessageImageDto>? Images { get; set; } = new List<MessageImageDto>();
    public bool HasCitations { get; set; }
    public bool HasToolCalls { get; set; }
    public double? GenerationTime { get; set; }
    public decimal? TotalCost { get; set; }
    public int AttachmentCount { get; set; }
}
