using OllamaWebuiBackend.Enums;

namespace OllamaWebuiBackend.DTOs;

public class ConversationSummaryDto
{
    public int Id { get; set; }
    public Guid ConversationId { get; set; }
    public required string Title { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public ProviderType Provider { get; set; }
    public bool IsPinned { get; set; }
    public bool IsHidden { get; set; }
    public IEnumerable<TagDto> Tags { get; set; } = new List<TagDto>();
}

public class ConversationDetailDto : ConversationSummaryDto
{
    public IEnumerable<MessageDto> Messages { get; set; } = new List<MessageDto>();
}
