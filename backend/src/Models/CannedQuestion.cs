using System.ComponentModel.DataAnnotations;

namespace OllamaWebuiBackend.Models;

public class CannedQuestion : BaseEntity
{
    [Required] [StringLength(200)] public required string Title { get; set; }

    [Required] [StringLength(1000)] public required string Text { get; set; }

    public int Order { get; set; } = 0;
}