using OllamaWebuiBackend.Enums;

namespace OllamaWebuiBackend.Models;

public class ProviderSettings : BaseEntity
{
    public int UserId { get; set; } // Foreign key to AppUser.Id (int)
    public ProviderType ProviderType { get; set; }
    public string? ApiKey { get; set; }
    public string? DefaultModel { get; set; }
    public string? ApiUrl { get; set; }

    public virtual AppUser User { get; set; } = null!;
}
