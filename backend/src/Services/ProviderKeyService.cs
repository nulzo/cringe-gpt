using System.Security.Cryptography;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Models;
using OllamaWebuiBackend.Repositories.Interfaces;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Services;

public class ApiKeyService : IApiKeyService
{
    private const string ApiKeyPrefix = "sk-";
    private const int ApiKeyLength = 32;
    private readonly IApiKeyRepository _apiKeyRepository;

    public ApiKeyService(IApiKeyRepository apiKeyRepository)
    {
        _apiKeyRepository = apiKeyRepository;
    }

    public async Task<NewApiKeyDto> CreateAsync(int userId, ApiKeyCreateDto createDto)
    {
        var (plaintextKey, hashedKey) = GenerateApiKey();

        var apiKey = new ApiKey
        {
            Name = createDto.Name,
            ExpiresAt = createDto.ExpiresAt,
            KeyPrefix = ApiKeyPrefix,
            HashedKey = hashedKey,
            UserId = userId
        };

        await _apiKeyRepository.AddAsync(apiKey);
        await _apiKeyRepository.SaveChangesAsync();

        var apiKeyDto = MapToDto(apiKey);

        return new NewApiKeyDto
        {
            KeyInfo = apiKeyDto,
            PlaintextKey = plaintextKey
        };
    }

    public async Task<IEnumerable<ApiKeyDto>> GetForUserAsync(int userId)
    {
        var apiKeys = await _apiKeyRepository.GetByUserIdAsync(userId);
        return apiKeys.Select(MapToDto);
    }

    public async Task<ApiKeyDto?> GetByIdAsync(int keyId, int userId)
    {
        var apiKey = await _apiKeyRepository.GetByIdAndUserIdAsync(keyId, userId);

        return apiKey == null ? null : MapToDto(apiKey);
    }

    public async Task<bool> UpdateAsync(int keyId, int userId, ApiKeyUpdateDto updateDto)
    {
        var apiKey = await _apiKeyRepository.GetTrackedByIdAndUserIdAsync(keyId, userId);
        if (apiKey == null) return false;

        apiKey.Name = updateDto.Name;
        await _apiKeyRepository.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RevokeAsync(int keyId, int userId)
    {
        var apiKey = await _apiKeyRepository.GetTrackedByIdAndUserIdAsync(keyId, userId);

        if (apiKey == null || apiKey.IsRevoked) return false;

        apiKey.IsRevoked = true;
        await _apiKeyRepository.SaveChangesAsync();
        return true;
    }

    public async Task<ApiKey?> GetValidKeyAsync(string key)
    {
        var allKeys = await _apiKeyRepository.GetAllActiveAsync();

        foreach (var storedKey in allKeys)
            if (BCrypt.Net.BCrypt.Verify(key, storedKey.HashedKey))
            {
                if (storedKey.ExpiresAt.HasValue &&
                    storedKey.ExpiresAt.Value < DateTime.UtcNow) return null; // Key expired

                // Update LastUsedAt asynchronously
                _ = Task.Run(() => _apiKeyRepository.UpdateLastUsedAsync(storedKey.Id));

                return storedKey;
            }

        return null;
    }

    private static (string plaintext, string hashed) GenerateApiKey()
    {
        var keyBytes = RandomNumberGenerator.GetBytes(ApiKeyLength);
        var plaintext = ApiKeyPrefix + Convert.ToBase64String(keyBytes)
            .Replace("+", "-")
            .Replace("/", "_");

        var hashed = BCrypt.Net.BCrypt.HashPassword(plaintext);

        return (plaintext, hashed);
    }

    private static ApiKeyDto MapToDto(ApiKey apiKey)
    {
        return new ApiKeyDto
        {
            Id = apiKey.Id,
            Name = apiKey.Name,
            KeyPrefix = apiKey.KeyPrefix,
            CreatedAt = apiKey.CreatedAt,
            ExpiresAt = apiKey.ExpiresAt,
            LastUsedAt = apiKey.LastUsedAt
        };
    }
}