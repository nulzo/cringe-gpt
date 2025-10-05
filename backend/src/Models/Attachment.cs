namespace OllamaWebuiBackend.Models;

public class MessageAttachment : BaseEntity
{
    public int MessageId { get; set; }
    public int FileId { get; set; }
    
    public virtual Message Message { get; set; } = null!;
    public virtual AppFile File { get; set; } = null!;
}