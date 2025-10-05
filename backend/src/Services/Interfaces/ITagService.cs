using OllamaWebuiBackend.DTOs;

namespace OllamaWebuiBackend.Services.Interfaces;

public interface ITagService
{
    Task<IEnumerable<TagDto>> GetAllAsync();
}