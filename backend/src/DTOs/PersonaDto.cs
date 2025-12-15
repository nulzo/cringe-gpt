using System.ComponentModel.DataAnnotations;
using OllamaWebuiBackend.Enums;

namespace OllamaWebuiBackend.DTOs;

public class PersonaParametersDto
{
    public double? Temperature { get; set; }
    public double? TopP { get; set; }
    public double? TopK { get; set; }
    public int? MaxTokens { get; set; }
    public bool? IsTemporary { get; set; }
}

public class PersonaDto
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public required string Instructions { get; set; }
    public string? Avatar { get; set; }
    public required ProviderType Provider { get; set; }
    public required string Model { get; set; }
    public PersonaParametersDto Parameters { get; set; } = new();
}

public class PersonaCreateDto
{
    [Required] public required string Name { get; set; }
    public string? Description { get; set; }
    [Required] public required string Instructions { get; set; }
    public string? Avatar { get; set; }
    [Required] public required ProviderType Provider { get; set; }
    [Required] public required string Model { get; set; }
    public PersonaParametersDto Parameters { get; set; } = new();
}

public class PersonaUpdateDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Instructions { get; set; }
    public string? Avatar { get; set; }
    public ProviderType? Provider { get; set; }
    public string? Model { get; set; }
    public PersonaParametersDto? Parameters { get; set; }
}


