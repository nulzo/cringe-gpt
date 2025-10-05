using Microsoft.EntityFrameworkCore;
using OllamaWebuiBackend.Data;
using OllamaWebuiBackend.Models;
using OllamaWebuiBackend.Repositories.Interfaces;

namespace OllamaWebuiBackend.Repositories;

public class PromptRepository : GenericRepository<Prompt>, IPromptRepository
{
    public PromptRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Prompt>> GetByTagNameAsync(string tagName)
    {
        return await _dbSet
            .AsNoTracking()
            .Include(p => p.Tags)
            .Where(p => p.Tags.Any(t => t.Name == tagName))
            .ToListAsync();
    }

    public async Task<Prompt?> GetByIdWithTagsAsync(int id)
    {
        return await _dbSet
            .Include(p => p.Tags)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<IEnumerable<Prompt>> GetAllWithTagsAsync()
    {
        return await _dbSet
            .AsNoTracking()
            .Include(p => p.Tags)
            .ToListAsync();
    }

    public async Task<Prompt?> GetByIdAsNoTrackingWithTagsAsync(int id)
    {
        return await _dbSet
            .AsNoTracking()
            .Include(p => p.Tags)
            .FirstOrDefaultAsync(p => p.Id == id);
    }
}