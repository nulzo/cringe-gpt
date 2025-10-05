namespace OllamaWebuiBackend.DTOs;

public class MessageStatsDto
{
    public int TotalMessages { get; set; }
    public int LikedMessages { get; set; }
    public int AssistantMessages { get; set; }
    public int UserMessages { get; set; }
    public Dictionary<string, int> MessagesByProvider { get; set; } = new();
    public Dictionary<string, int> MessagesByModel { get; set; } = new();
}
