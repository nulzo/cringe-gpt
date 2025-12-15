using OllamaWebuiBackend.Enums;

namespace OllamaWebuiBackend.Models;

public class UsageMetric : BaseEntity
{
    public int UserId { get; set; }
    public int ConversationId { get; set; }
    public int MessageId { get; set; }
    public ProviderType Provider { get; set; }
    public required string Model { get; set; }
    public int PromptTokens { get; set; }
    public int CompletionTokens { get; set; }
    public decimal CostInUSD { get; set; }
    public int DurationMs { get; set; }

    public virtual AppUser User { get; set; } = null!;
    public virtual Conversation Conversation { get; set; } = null!;
    public virtual Message Message { get; set; } = null!;
}
