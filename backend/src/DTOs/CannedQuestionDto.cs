using System.ComponentModel.DataAnnotations;

namespace OllamaWebuiBackend.DTOs;

public class CannedQuestionDto
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public required string Text { get; set; }
    public int Order { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CannedQuestionCreateDto
{
    [Required][StringLength(200)] public required string Title { get; set; }

    [Required][StringLength(1000)] public required string Text { get; set; }

    public int Order { get; set; } = 0;
}

public class CannedQuestionUpdateDto
{
    [StringLength(200)] public string? Title { get; set; }

    [StringLength(1000)] public string? Text { get; set; }

    public int? Order { get; set; }
}

public class CannedQuestionReorderDto
{
    public int Id { get; set; }
    public int Order { get; set; }
}
