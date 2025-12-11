using OllamaWebuiBackend.Models;

namespace OllamaWebuiBackend.Repositories.Interfaces;

public interface IAgentRepository : IGenericRepository<Agent>
{
    Task<IEnumerable<Agent>> GetAllForUserAsync(int userId);
    Task<Agent?> GetByIdForUserAsync(int id, int userId);
}

