namespace OllamaWebuiBackend.Models;

public class MessageError : BaseEntity
{
    public int MessageId { get; set; }
    public string? ErrorCode { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }

    public virtual Message Message { get; set; } = null!;
}