using OllamaWebuiBackend.Models;

namespace OllamaWebuiBackend.Repositories.Interfaces;

public interface IApiKeyRepository : IGenericRepository<ApiKey>
{
    Task<IEnumerable<ApiKey>> GetByUserIdAsync(int userId);
    Task<ApiKey?> GetByIdAndUserIdAsync(int keyId, int userId);
    Task<ApiKey?> GetTrackedByIdAndUserIdAsync(int keyId, int userId);
    Task<IEnumerable<ApiKey>> GetAllActiveAsync();
    Task UpdateLastUsedAsync(int keyId);
}
