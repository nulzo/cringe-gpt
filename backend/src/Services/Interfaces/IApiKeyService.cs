using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Models;

namespace OllamaWebuiBackend.Services.Interfaces;

public interface IApiKeyService
{
    Task<NewApiKeyDto> CreateAsync(int userId, ApiKeyCreateDto createDto);
    Task<IEnumerable<ApiKeyDto>> GetForUserAsync(int userId);
    Task<ApiKeyDto?> GetByIdAsync(int keyId, int userId);
    Task<bool> UpdateAsync(int keyId, int userId, ApiKeyUpdateDto updateDto);
    Task<bool> RevokeAsync(int keyId, int userId);
    Task<ApiKey?> GetValidKeyAsync(string key);
}
