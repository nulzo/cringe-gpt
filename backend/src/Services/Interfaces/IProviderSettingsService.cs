using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Enums;
using OllamaWebuiBackend.Models;

namespace OllamaWebuiBackend.Services.Interfaces;

public interface IProviderSettingsService
{
    Task<ProviderSettingsDto> GetAsync(int userId, ProviderType providerType);
    Task<ProviderSettings> GetFullSettingsAsync(int userId, ProviderType providerType);
    Task UpdateAsync(int userId, ProviderType providerType, ProviderSettingsDto settings);
    string? GetDefaultApiUrl();
}
