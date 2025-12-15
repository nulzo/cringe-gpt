using Microsoft.EntityFrameworkCore;
using OllamaWebuiBackend.Data;
using OllamaWebuiBackend.Models;
using OllamaWebuiBackend.Repositories.Interfaces;

namespace OllamaWebuiBackend.Repositories;

public class OrganizationRepository : GenericRepository<Organization>, IOrganizationRepository
{
    public OrganizationRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<OrganizationMember>> GetByUserIdAsync(int userId)
    {
        return await _context.OrganizationMembers
            .AsNoTracking()
            .Where(om => om.UserId == userId)
            .Include(om => om.Organization)
            .ToListAsync();
    }

    public async Task<OrganizationMember?> GetWithDetailsByIdAndUserIdAsync(int orgId, int userId)
    {
        return await _context.OrganizationMembers
            .AsNoTracking()
            .Include(om => om.Organization)
            .ThenInclude(o => o.Projects)
            .Include(om => om.Organization)
            .ThenInclude(o => o.Members)
            .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(om => om.OrganizationId == orgId && om.UserId == userId);
    }
}
