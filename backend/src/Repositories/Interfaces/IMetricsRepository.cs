using OllamaWebuiBackend.Models;

namespace OllamaWebuiBackend.Repositories.Interfaces;

public interface IMetricsRepository : IGenericRepository<UsageMetric>
{
    IQueryable<UsageMetric> GetFiltered(int userId, DateTime? from, DateTime? to);
    Task<IEnumerable<UsageMetric>> GetAllOrderedByDateAsync();
}