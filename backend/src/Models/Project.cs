using System.ComponentModel.DataAnnotations;

namespace OllamaWebuiBackend.Models;

public class Project : BaseEntity
{
    [Required][StringLength(100)] public required string Name { get; set; }

    public int OrganizationId { get; set; }
    public virtual Organization Organization { get; set; } = null!;

    public virtual ICollection<Conversation> Conversations { get; set; } = new List<Conversation>();
}
