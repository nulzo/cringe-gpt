using OllamaWebuiBackend.DTOs;

namespace OllamaWebuiBackend.Services.Interfaces;

public interface IPromptService
{
    Task<IEnumerable<PromptDto>> GetAllAsync(int userId);
    Task<IEnumerable<PromptDto>> GetByTagAsync(string tagName, int userId);
    Task<PromptDto?> GetByIdAsync(int id, int userId);
    Task<PromptDto> CreateAsync(int userId, PromptCreateDto createDto);
    Task<PromptDto?> UpdateAsync(int id, int userId, PromptUpdateDto updateDto);
    Task<bool> DeleteAsync(int id, int userId);
}
