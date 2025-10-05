using OllamaWebuiBackend.Enums;

namespace OllamaWebuiBackend.Models;

public class Conversation : BaseEntity
{
    public Guid ConversationId { get; set; } = Guid.NewGuid();
    public int UserId { get; set; }
    public int? ProjectId { get; set; } // Nullable for personal conversations

    public required string Title { get; set; }
    public ProviderType Provider { get; set; }
    public bool IsPinned { get; set; }
    public bool IsHidden { get; set; }

    // DDD: factory to create a new conversation
    public static Conversation Create(int userId, string title, ProviderType provider)
    {
        return new Conversation
        {
            UserId = userId,
            Title = title,
            Provider = provider
        };
    }
    
    // DDD: attach an existing message to this conversation
    public Message AddMessage(Message message)
    {
        message.Conversation = this;
        this.Messages.Add(message);
        return message;
    }

    // DDD: factory for a new message from raw values
    public Message AddMessage(string role, string content, ProviderType? provider = null, string? model = null, Guid? parentMessageId = null, int? tokenCount = null, string? finishReason = null)
    {
        var message = new Message
        {
            Role = role,
            Content = content,
            Provider = provider,
            Model = model,
            ParentMessageId = parentMessageId,
            TokenCount = tokenCount,
            FinishReason = finishReason,
            Conversation = this
        };
        this.Messages.Add(message);
        return message;
    }

    public virtual AppUser User { get; set; } = null!;
    public virtual Project? Project { get; set; } // Nullable for personal conversations
    public virtual ICollection<Message> Messages { get; set; } = new List<Message>();
    public virtual ICollection<Tag> Tags { get; set; } = new List<Tag>();
}