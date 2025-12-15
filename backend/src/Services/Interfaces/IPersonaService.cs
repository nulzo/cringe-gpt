using OllamaWebuiBackend.DTOs;

namespace OllamaWebuiBackend.Services.Interfaces;

public interface IPersonaService
{
    Task<IEnumerable<PersonaDto>> GetAllAsync(int userId);
    Task<PersonaDto?> GetByIdAsync(int id, int userId);
    Task<PersonaDto> CreateAsync(int userId, PersonaCreateDto createDto);
    Task<PersonaDto?> UpdateAsync(int id, int userId, PersonaUpdateDto updateDto);
    Task<bool> DeleteAsync(int id, int userId);
}


