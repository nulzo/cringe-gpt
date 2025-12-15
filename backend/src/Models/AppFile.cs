namespace OllamaWebuiBackend.Models;

public class KnowledgeBase : BaseEntity
{
    public int UserId { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }

    public virtual AppUser User { get; set; } = null!;
    public virtual ICollection<KnowledgeBaseFile> Files { get; set; } = new List<KnowledgeBaseFile>();
}

public class AppFile : BaseEntity
{
    public int UserId { get; set; }
    public required string Name { get; set; }
    public required string FilePath { get; set; }
    public long Size { get; set; }
    public required string MimeType { get; set; }

    public virtual AppUser User { get; set; } = null!;
}

// Join table for many-to-many relationship
public class KnowledgeBaseFile
{
    public int KnowledgeBaseId { get; set; }
    public KnowledgeBase KnowledgeBase { get; set; } = null!;

    public int FileId { get; set; }
    public AppFile File { get; set; } = null!;
}
