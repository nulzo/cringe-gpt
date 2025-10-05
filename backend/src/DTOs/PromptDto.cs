using System.ComponentModel.DataAnnotations;

namespace OllamaWebuiBackend.DTOs;

public class TagDto
{
    public int Id { get; set; }
    public required string Name { get; set; }
}

public class PromptDto
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public required string Content { get; set; }
    public List<TagDto> Tags { get; set; } = new();
}

public class PromptCreateDto
{
    [Required] public required string Title { get; set; }

    [Required] public required string Content { get; set; }

    public List<string> Tags { get; set; } = new();
}

public class PromptUpdateDto
{
    public string? Title { get; set; }
    public string? Content { get; set; }
    public List<string>? Tags { get; set; }
}