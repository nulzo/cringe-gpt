using Microsoft.EntityFrameworkCore;
using OllamaWebuiBackend.Data;
using OllamaWebuiBackend.Models;
using OllamaWebuiBackend.Repositories.Interfaces;

namespace OllamaWebuiBackend.Repositories;

public class CannedQuestionRepository(AppDbContext context)
    : GenericRepository<CannedQuestion>(context), ICannedQuestionRepository
{
    public async Task<IEnumerable<CannedQuestion>> GetAllOrderedAsync()
    {
        return await _dbSet
            .OrderBy(q => q.Order)
            .ThenBy(q => q.CreatedAt)
            .ToListAsync();
    }

    public override async Task<CannedQuestion?> GetByIdAsync(int id)
    {
        return await _dbSet
            .FirstOrDefaultAsync(q => q.Id == id);
    }

    public async Task<IEnumerable<CannedQuestion>> GetByOrderRangeAsync(int minOrder, int maxOrder)
    {
        return await _dbSet
            .Where(q => q.Order >= minOrder && q.Order <= maxOrder)
            .OrderBy(q => q.Order)
            .ToListAsync();
    }

    public async Task<int> GetMaxOrderAsync()
    {
        if (!await _dbSet.AnyAsync())
            return 0;

        return await _dbSet.MaxAsync(q => q.Order);
    }

    public async Task UpdateOrdersAsync(IEnumerable<CannedQuestion> questions)
    {
        foreach (var question in questions)
        {
            _context.Entry(question).Property(q => q.Order).IsModified = true;
            _context.Entry(question).Property(q => q.UpdatedAt).IsModified = true;
        }

        await _context.SaveChangesAsync();
    }
}
