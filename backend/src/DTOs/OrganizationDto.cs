using System.ComponentModel.DataAnnotations;
using OllamaWebuiBackend.Models;

namespace OllamaWebuiBackend.DTOs;

public class OrganizationDto
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public OrganizationRole UserRole { get; set; }
}

public class OrganizationCreateDto
{
    [Required][StringLength(100)] public required string Name { get; set; }
}

public class OrganizationMemberDto
{
    public int UserId { get; set; }
    public required string Email { get; set; }
    public OrganizationRole Role { get; set; }
}

public class OrganizationDetailDto : OrganizationDto
{
    public List<OrganizationMemberDto> Members { get; set; } = new();
    public List<ProjectDto> Projects { get; set; } = new();
}

public class ProjectDto
{
    public int Id { get; set; }
    public required string Name { get; set; }
}

public class ProjectCreateDto
{
    [Required][StringLength(100)] public required string Name { get; set; }
}
