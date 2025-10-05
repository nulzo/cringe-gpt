namespace OllamaWebuiBackend.Models;

public class Tool : BaseEntity
{
    public int CreatedById { get; set; } // Foreign key to AppUser.Id (int)
    public required string Name { get; set; }
    public string? Description { get; set; }
    public required string ParametersJson { get; set; } // JSON Schema for parameters

    public virtual AppUser CreatedBy { get; set; } = null!;
}