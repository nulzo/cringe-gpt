namespace OllamaWebuiBackend.Models;

public class Prompt : BaseEntity
{
    public int UserId { get; set; }
    public required string Title { get; set; }
    public required string Content { get; set; }
    public string? VariablesJson { get; set; }

    public virtual AppUser User { get; set; } = null!;
    public virtual ICollection<Tag> Tags { get; set; } = new List<Tag>();
}
