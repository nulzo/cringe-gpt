namespace OllamaWebuiBackend.Models;

public class Prompt : BaseEntity
{
    public required string Title { get; set; }
    public required string Content { get; set; }

    public virtual ICollection<Tag> Tags { get; set; } = new List<Tag>();
}