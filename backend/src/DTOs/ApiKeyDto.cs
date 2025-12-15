using System.ComponentModel.DataAnnotations;

namespace OllamaWebuiBackend.DTOs;

public class ApiKeyDto
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string KeyPrefix { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime? LastUsedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ApiKeyCreateDto
{
    [Required][StringLength(100)] public required string Name { get; set; }

    public DateTime? ExpiresAt { get; set; }
}

public class ApiKeyUpdateDto
{
    [Required][StringLength(100)] public required string Name { get; set; }
}

public class NewApiKeyDto
{
    public required ApiKeyDto KeyInfo { get; set; }
    public required string PlaintextKey { get; set; }
}
