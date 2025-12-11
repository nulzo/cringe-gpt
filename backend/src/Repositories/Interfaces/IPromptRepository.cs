using OllamaWebuiBackend.Models;

namespace OllamaWebuiBackend.Repositories.Interfaces;

public interface IPromptRepository : IGenericRepository<Prompt>
{
    Task<IEnumerable<Prompt>> GetByTagNameAsync(string tagName);
    Task<Prompt?> GetByIdWithTagsAsync(int id);
    Task<IEnumerable<Prompt>> GetAllWithTagsAsync();
    Task<Prompt?> GetByIdAsNoTrackingWithTagsAsync(int id);
    Task<IEnumerable<Prompt>> GetAllForUserAsync(int userId);
    Task<Prompt?> GetByIdForUserAsync(int id, int userId);
    Task<IEnumerable<Prompt>> GetByTagNameForUserAsync(string tagName, int userId);
}