using System.ComponentModel.DataAnnotations;

namespace OllamaWebuiBackend.DTOs;

public class TagDto
{
    public int Id { get; set; }
    public required string Name { get; set; }
}

public class PromptVariableDto
{
    public required string Name { get; set; }
    public string? Label { get; set; }
    public string? Description { get; set; }
    public string? Placeholder { get; set; }
    public bool Required { get; set; } = true;
}

public class PromptDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public required string Title { get; set; }
    public required string Content { get; set; }
    public List<TagDto> Tags { get; set; } = new();
    public List<PromptVariableDto> Variables { get; set; } = new();
}

public class PromptCreateDto
{
    [Required] public required string Title { get; set; }

    [Required] public required string Content { get; set; }

    public List<string> Tags { get; set; } = new();
    public List<PromptVariableDto> Variables { get; set; } = new();
}

public class PromptUpdateDto
{
    public string? Title { get; set; }
    public string? Content { get; set; }
    public List<string>? Tags { get; set; }
    public List<PromptVariableDto>? Variables { get; set; }
}
