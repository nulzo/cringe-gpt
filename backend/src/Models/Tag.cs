using System.ComponentModel.DataAnnotations;

namespace OllamaWebuiBackend.Models;

public class Tag : BaseEntity
{
    [Required][StringLength(50)] public required string Name { get; set; }

    public virtual ICollection<Prompt> Prompts { get; set; } = new List<Prompt>();
}
