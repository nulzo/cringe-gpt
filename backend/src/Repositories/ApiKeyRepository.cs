using Microsoft.EntityFrameworkCore;
using OllamaWebuiBackend.Data;
using OllamaWebuiBackend.Models;
using OllamaWebuiBackend.Repositories.Interfaces;

namespace OllamaWebuiBackend.Repositories;

public class ApiKeyRepository : GenericRepository<ApiKey>, IApiKeyRepository
{
    public ApiKeyRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<ApiKey>> GetByUserIdAsync(int userId)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(k => k.UserId == userId && !k.IsRevoked)
            .ToListAsync();
    }

    public async Task<ApiKey?> GetByIdAndUserIdAsync(int keyId, int userId)
    {
        return await _dbSet
            .AsNoTracking()
            .FirstOrDefaultAsync(k => k.Id == keyId && k.UserId == userId);
    }

    public async Task<ApiKey?> GetTrackedByIdAndUserIdAsync(int keyId, int userId)
    {
        return await _dbSet
            .FirstOrDefaultAsync(k => k.Id == keyId && k.UserId == userId);
    }

    public async Task<IEnumerable<ApiKey>> GetAllActiveAsync()
    {
        return await _dbSet.Where(k => !k.IsRevoked).ToListAsync();
    }

    public async Task UpdateLastUsedAsync(int keyId)
    {
        var key = await _dbSet.FindAsync(keyId);
        if (key != null)
        {
            key.LastUsedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }
}