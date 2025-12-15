namespace OllamaWebuiBackend.Models;

public class Agent : BaseEntity
{
    public int AuthorId { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public required string Instructions { get; set; } // The system prompt
    public string? Avatar { get; set; } // URL or encoded image

    public required string Provider { get; set; }
    public required string Model { get; set; }
    public string? ModelParametersJson { get; set; } // JSON for temp, top_p, etc.

    public virtual AppUser Author { get; set; } = null!;
    // Future relationships
    // public virtual ICollection<AgentTool> AgentTools { get; set; } = new List<AgentTool>();
    // public virtual ICollection<AgentKnowledgeBase> AgentKnowledgeBases { get; set; } = new List<AgentKnowledgeBase>();
}
