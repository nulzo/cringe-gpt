using Microsoft.EntityFrameworkCore;
using OllamaWebuiBackend.Data;
using OllamaWebuiBackend.Models;
using OllamaWebuiBackend.Repositories.Interfaces;

namespace OllamaWebuiBackend.Repositories;

public class TagRepository : GenericRepository<Tag>, ITagRepository
{
    public TagRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<List<Tag>> GetOrCreateTagsAsync(List<string> tagNames)
    {
        var normalized = tagNames
            .Where(t => !string.IsNullOrWhiteSpace(t))
            .Select(t => t.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var normalizedSet = normalized.ToHashSet(StringComparer.OrdinalIgnoreCase);

        var tags = new List<Tag>();
        var existingTags = await _dbSet
            .Where(t => normalizedSet.Contains(t.Name))
            .ToListAsync();

        tags.AddRange(existingTags);

        var existingNames = existingTags
            .Select(t => t.Name)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var newTagNames = normalized.Where(name => !existingNames.Contains(name));
        foreach (var tagName in newTagNames)
        {
            var newTag = new Tag { Name = tagName };
            tags.Add(newTag);
            // No need to call Add on _dbSet here because
            // these tags will be attached to a new entity,
            // and EF will track them as new entities.
        }

        return tags;
    }
}
