using OllamaWebuiBackend.DTOs;

namespace OllamaWebuiBackend.Services.Interfaces;

public interface IPromptService
{
    Task<IEnumerable<PromptDto>> GetAllAsync();
    Task<IEnumerable<PromptDto>> GetByTagAsync(string tagName);
    Task<PromptDto?> GetByIdAsync(int id);
    Task<PromptDto> CreateAsync(PromptCreateDto createDto);
    Task<PromptDto?> UpdateAsync(int id, PromptUpdateDto updateDto);
    Task<bool> DeleteAsync(int id);
}