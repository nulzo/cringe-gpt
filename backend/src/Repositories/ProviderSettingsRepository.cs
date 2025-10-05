using Microsoft.EntityFrameworkCore;
using OllamaWebuiBackend.Data;
using OllamaWebuiBackend.Enums;
using OllamaWebuiBackend.Models;
using OllamaWebuiBackend.Repositories.Interfaces;

namespace OllamaWebuiBackend.Repositories;

public class ProviderSettingsRepository : GenericRepository<ProviderSettings>, IProviderSettingsRepository
{
    public ProviderSettingsRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<ProviderSettings> GetOrCreateAsync(int userId, ProviderType providerType)
    {
        var settings = await _dbSet
            .FirstOrDefaultAsync(s => s.UserId == userId && s.ProviderType == providerType);

        if (settings == null)
        {
            settings = new ProviderSettings
            {
                UserId = userId,
                ProviderType = providerType
            };
            await _dbSet.AddAsync(settings);
            await _context.SaveChangesAsync();
        }

        return settings;
    }
}