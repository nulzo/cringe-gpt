using OllamaWebuiBackend.Enums;

namespace OllamaWebuiBackend.Models;

public class Message : BaseEntity
{
    public Guid MessageId { get; set; } = Guid.NewGuid();
    public Guid? ParentMessageId { get; set; }

    public int ConversationId { get; set; }
    public required string Role { get; set; } // "user" or "assistant"
    public required string Content { get; set; }

    // New Fields
    public ProviderType? Provider { get; set; }
    public string? Model { get; set; }
    public int? TokenCount { get; set; }
    public string? FinishReason { get; set; }
    public bool IsLiked { get; set; }
    public bool IsHidden { get; set; }
    public bool IsError { get; set; }

    // Placeholders for future features
    public bool HasImages { get; set; }
    public bool HasCitations { get; set; }
    public string? CitationsJson { get; set; } // Storing as JSON string
    public bool HasToolCalls { get; set; }
    public string? ToolCallsJson { get; set; } // Storing as JSON string

    public virtual Conversation Conversation { get; set; } = null!;
    public virtual MessageError? Error { get; set; }
    public virtual ICollection<MessageAttachment> Attachments { get; set; } = new List<MessageAttachment>();
}
