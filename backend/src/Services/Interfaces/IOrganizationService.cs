using OllamaWebuiBackend.DTOs;

namespace OllamaWebuiBackend.Services.Interfaces;

public interface IOrganizationService
{
    Task<OrganizationDto> CreateAsync(int ownerId, OrganizationCreateDto createDto);
    Task<IEnumerable<OrganizationDto>> GetForUserAsync(int userId);
    Task<OrganizationDetailDto?> GetByIdAsync(int orgId, int userId);

    // Member Management
    Task<OrganizationMemberDto?> AddMemberAsync(int orgId, int actorUserId, int targetUserId, string role);
    Task<bool> RemoveMemberAsync(int orgId, int actorUserId, int targetUserId);
    Task<bool> UpdateMemberRoleAsync(int orgId, int actorUserId, int targetUserId, string role);

    // Project Management
    Task<ProjectDto> CreateProjectAsync(int orgId, int userId, ProjectCreateDto createDto);
    Task<bool> DeleteProjectAsync(int orgId, int userId, int projectId);
}