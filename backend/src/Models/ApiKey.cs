using System.ComponentModel.DataAnnotations;

namespace OllamaWebuiBackend.Models;

public class ApiKey : BaseEntity
{
    [Required] [StringLength(100)] public required string Name { get; set; }

    [Required] public required string HashedKey { get; set; }

    [Required] [StringLength(10)] public required string KeyPrefix { get; set; } // e.g., "sk-..."

    public DateTime? ExpiresAt { get; set; }

    public DateTime? LastUsedAt { get; set; }

    public bool IsRevoked { get; set; } = false;

    public int UserId { get; set; }
    public virtual AppUser User { get; set; } = null!;
}