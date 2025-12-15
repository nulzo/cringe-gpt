namespace OllamaWebuiBackend.DTOs;

public class ConversationUpdateDto
{
    public string? Title { get; set; }
    public bool? IsPinned { get; set; }
    public bool? IsHidden { get; set; }
    public List<string>? Tags { get; set; }
}
