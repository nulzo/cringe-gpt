namespace OllamaWebuiBackend.DTOs;

public class ConversationSummaryDto
{
    public int Id { get; set; }
    public Guid ConversationId { get; set; }
    public required string Title { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class ConversationDetailDto : ConversationSummaryDto
{
    public IEnumerable<MessageDto> Messages { get; set; } = new List<MessageDto>();
}