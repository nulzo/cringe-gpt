using Microsoft.AspNetCore.Identity;

namespace OllamaWebuiBackend.Models;

public class AppUser : IdentityUser<int>
{
    public string? Avatar { get; set; }
    public string Provider { get; set; } = "local";

    // Add any additional user properties here
    public bool IsDeleted { get; set; } = false;

    public virtual UserSettings Settings { get; set; } = null!;
    public virtual ICollection<Conversation> Conversations { get; set; } = new List<Conversation>();
    public virtual ICollection<ProviderSettings> ProviderSettings { get; set; } = new List<ProviderSettings>();
    public virtual ICollection<Agent> Agents { get; set; } = new List<Agent>();
    public virtual ICollection<Tool> Tools { get; set; } = new List<Tool>();
    public virtual ICollection<KnowledgeBase> KnowledgeBases { get; set; } = new List<KnowledgeBase>();
    public virtual ICollection<AppFile> Files { get; set; } = new List<AppFile>();
    public virtual ICollection<ApiKey> ApiKeys { get; set; } = new List<ApiKey>();

    public virtual ICollection<OrganizationMember> OrganizationMemberships { get; set; } =
        new List<OrganizationMember>();
}

public class UserSettings : BaseEntity
{
    public int UserId { get; set; }
    public string Theme { get; set; } = "dark";
    public string? PreferredModel { get; set; }

    public virtual AppUser User { get; set; } = null!;
}