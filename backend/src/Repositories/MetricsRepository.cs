using Microsoft.EntityFrameworkCore;
using OllamaWebuiBackend.Data;
using OllamaWebuiBackend.Models;
using OllamaWebuiBackend.Repositories.Interfaces;

namespace OllamaWebuiBackend.Repositories;

public class MetricsRepository : GenericRepository<UsageMetric>, IMetricsRepository
{
    public MetricsRepository(AppDbContext context) : base(context)
    {
    }

    public IQueryable<UsageMetric> GetFiltered(int userId, DateTime? from, DateTime? to)
    {
        var query = _dbSet
            .AsNoTracking()
            .Where(m => m.UserId == userId);

        if (from.HasValue) query = query.Where(m => m.CreatedAt >= from.Value);

        if (to.HasValue) query = query.Where(m => m.CreatedAt <= to.Value);

        return query;
    }

    public async Task<IEnumerable<UsageMetric>> GetAllOrderedByDateAsync()
    {
        return await _dbSet
            .AsNoTracking()
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync();
    }
}
