using AutoMapper;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Models;
using OllamaWebuiBackend.Repositories.Interfaces;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Services;

public class OrganizationService : IOrganizationService
{
    private readonly IMapper _mapper;
    private readonly IOrganizationRepository _organizationRepository;

    public OrganizationService(IOrganizationRepository organizationRepository, IMapper mapper)
    {
        _organizationRepository = organizationRepository;
        _mapper = mapper;
    }

    public async Task<OrganizationDto> CreateAsync(int ownerId, OrganizationCreateDto createDto)
    {
        var organization = new Organization
        {
            Name = createDto.Name
        };

        organization.Members.Add(new OrganizationMember
        {
            UserId = ownerId,
            Role = OrganizationRole.Owner
        });

        await _organizationRepository.AddAsync(organization);
        await _organizationRepository.SaveChangesAsync();

        var dto = _mapper.Map<OrganizationDto>(organization);
        dto.UserRole = OrganizationRole.Owner; // Manually set role for the creator
        return dto;
    }

    public async Task<IEnumerable<OrganizationDto>> GetForUserAsync(int userId)
    {
        var memberships = await _organizationRepository.GetByUserIdAsync(userId);

        return memberships.Select(m =>
        {
            var dto = _mapper.Map<OrganizationDto>(m.Organization);
            dto.UserRole = m.Role;
            return dto;
        });
    }

    public async Task<OrganizationDetailDto?> GetByIdAsync(int orgId, int userId)
    {
        var member = await _organizationRepository.GetWithDetailsByIdAndUserIdAsync(orgId, userId);

        if (member == null) return null;

        var dto = _mapper.Map<OrganizationDetailDto>(member.Organization);
        dto.UserRole = member.Role;
        return dto;
    }

    // Member management and project management methods will be implemented later
    public Task<OrganizationMemberDto?> AddMemberAsync(int orgId, int actorUserId, int targetUserId, string role)
    {
        throw new NotImplementedException();
    }

    public Task<bool> RemoveMemberAsync(int orgId, int actorUserId, int targetUserId)
    {
        throw new NotImplementedException();
    }

    public Task<bool> UpdateMemberRoleAsync(int orgId, int actorUserId, int targetUserId, string role)
    {
        throw new NotImplementedException();
    }

    public Task<ProjectDto> CreateProjectAsync(int orgId, int userId, ProjectCreateDto createDto)
    {
        throw new NotImplementedException();
    }

    public Task<bool> DeleteProjectAsync(int orgId, int userId, int projectId)
    {
        throw new NotImplementedException();
    }
}