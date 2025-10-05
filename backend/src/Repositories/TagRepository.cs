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
        var tags = new List<Tag>();
        var existingTags = await _dbSet
            .Where(t => tagNames.Contains(t.Name))
            .ToListAsync();

        tags.AddRange(existingTags);

        var newTagNames = tagNames.Except(existingTags.Select(t => t.Name));
        foreach (var tagName in newTagNames)
        {
            var newTag = new Tag { Name = tagName };
            tags.Add(newTag);
            // No need to call Add on _dbSet here because
            // these tags will be attached to a new Prompt entity,
            // and EF will track them as new entities.
        }

        return tags;
    }
}