using Microsoft.EntityFrameworkCore;
using OllamaWebuiBackend.Data;
using OllamaWebuiBackend.Models;
using OllamaWebuiBackend.Repositories.Interfaces;

namespace OllamaWebuiBackend.Repositories;

public class AgentRepository : GenericRepository<Agent>, IAgentRepository
{
    public AgentRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Agent>> GetAllForUserAsync(int userId)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(a => a.AuthorId == userId)
            .ToListAsync();
    }

    public async Task<Agent?> GetByIdForUserAsync(int id, int userId)
    {
        return await _dbSet
            .FirstOrDefaultAsync(a => a.Id == id && a.AuthorId == userId);
    }
}


