using System.ComponentModel.DataAnnotations;

namespace OllamaWebuiBackend.Models;

public class Organization : BaseEntity
{
    [Required] [StringLength(100)] public required string Name { get; set; }

    public virtual ICollection<OrganizationMember> Members { get; set; } = new List<OrganizationMember>();
    public virtual ICollection<Project> Projects { get; set; } = new List<Project>();
}

public class OrganizationMember
{
    public int OrganizationId { get; set; }
    public virtual Organization Organization { get; set; } = null!;

    public int UserId { get; set; }
    public virtual AppUser User { get; set; } = null!;

    public OrganizationRole Role { get; set; } = OrganizationRole.Member;
}

public enum OrganizationRole
{
    Owner,
    Admin,
    Member
}