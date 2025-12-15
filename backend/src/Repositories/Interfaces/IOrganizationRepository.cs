using OllamaWebuiBackend.Models;

namespace OllamaWebuiBackend.Repositories.Interfaces;

public interface IOrganizationRepository : IGenericRepository<Organization>
{
    Task<IEnumerable<OrganizationMember>> GetByUserIdAsync(int userId);
    Task<OrganizationMember?> GetWithDetailsByIdAndUserIdAsync(int orgId, int userId);
}
