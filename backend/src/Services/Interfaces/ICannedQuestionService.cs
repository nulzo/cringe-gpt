using OllamaWebuiBackend.DTOs;

namespace OllamaWebuiBackend.Services.Interfaces;

public interface ICannedQuestionService
{
    Task<IEnumerable<CannedQuestionDto>> GetAllAsync();
    Task<CannedQuestionDto?> GetByIdAsync(int id);
    Task<CannedQuestionDto> CreateAsync(CannedQuestionCreateDto createDto);
    Task<CannedQuestionDto> UpdateAsync(int id, CannedQuestionUpdateDto updateDto);
    Task DeleteAsync(int id);
    Task<CannedQuestionDto> UpdateOrderAsync(int id, int newOrder);
    Task<IEnumerable<CannedQuestionDto>> ReorderAsync(IEnumerable<CannedQuestionReorderDto> reorderRequests);
}
