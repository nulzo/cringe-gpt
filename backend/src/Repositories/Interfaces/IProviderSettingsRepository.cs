using OllamaWebuiBackend.Enums;
using OllamaWebuiBackend.Models;

namespace OllamaWebuiBackend.Repositories.Interfaces;

public interface IProviderSettingsRepository : IGenericRepository<ProviderSettings>
{
    Task<ProviderSettings> GetOrCreateAsync(int userId, ProviderType providerType);
}