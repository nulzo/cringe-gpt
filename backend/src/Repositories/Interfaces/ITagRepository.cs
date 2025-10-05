using OllamaWebuiBackend.Models;

namespace OllamaWebuiBackend.Repositories.Interfaces;

public interface ITagRepository : IGenericRepository<Tag>
{
    Task<List<Tag>> GetOrCreateTagsAsync(List<string> tagNames);
}