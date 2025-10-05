namespace OllamaWebuiBackend.DTOs;

public class ConversationSearchPayloadDto
{
    public required string Kind { get; set; } = "message";
    public Guid? MessageId { get; set; }
    public required string Snippet { get; set; }
}

public class ConversationSearchItemDto
{
    public int Id { get; set; }
    public Guid ConversationId { get; set; }
    public Guid? CurrentNodeId { get; set; }
    public required string Title { get; set; }
    public bool IsArchived { get; set; } = false;
    public bool? IsStarred { get; set; } = null;
    public double UpdateTime { get; set; }
    public required ConversationSearchPayloadDto Payload { get; set; }
}

public class ConversationSearchResponseDto
{
    public required IEnumerable<ConversationSearchItemDto> Items { get; set; }
    public string? Cursor { get; set; }
}


