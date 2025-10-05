using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Enums;
using OllamaWebuiBackend.Models;
using OllamaWebuiBackend.Repositories.Interfaces;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Services;

public class ProviderSettingsService : IProviderSettingsService
{
    private readonly IConfiguration _configuration;
    private readonly IProviderSettingsRepository _providerSettingsRepository;

    public ProviderSettingsService(IProviderSettingsRepository providerSettingsRepository, IConfiguration configuration)
    {
        _providerSettingsRepository = providerSettingsRepository;
        _configuration = configuration;
    }

    public async Task<ProviderSettingsDto> GetAsync(int userId, ProviderType providerType)
    {
        var settings = await _providerSettingsRepository.GetOrCreateAsync(userId, providerType);
        return new ProviderSettingsDto
        {
            ApiKey = settings.ApiKey,
            DefaultModel = settings.DefaultModel,
            ApiUrl = settings.ApiUrl
        };
    }

    public async Task<ProviderSettings> GetFullSettingsAsync(int userId, ProviderType providerType)
    {
        return await _providerSettingsRepository.GetOrCreateAsync(userId, providerType);
    }

    public async Task UpdateAsync(int userId, ProviderType providerType, ProviderSettingsDto settingsDto)
    {
        var settings = await _providerSettingsRepository.GetOrCreateAsync(userId, providerType);

        settings.ApiKey = settingsDto.ApiKey;
        settings.DefaultModel = settingsDto.DefaultModel;
        settings.ApiUrl = settingsDto.ApiUrl;

        _providerSettingsRepository.Update(settings);
        await _providerSettingsRepository.SaveChangesAsync();
    }

    public string? GetDefaultApiUrl()
    {
        return _configuration["DefaultApiUrl"];
    }
}