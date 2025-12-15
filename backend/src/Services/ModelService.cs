using AutoMapper;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Enums;
using OllamaWebuiBackend.Services.Interfaces;
using OllamaWebuiBackend.Services.Providers.Interfaces;

namespace OllamaWebuiBackend.Services;

public class ModelService : IModelService
{
    private readonly ILogger<IModelService> _logger;
    private readonly IMapper _mapper;
    private readonly IEnumerable<IChatProvider> _providers;
    private readonly IProviderSettingsService _settingsService;


    public ModelService(IEnumerable<IChatProvider> providers, IProviderSettingsService settingsService,
        ILogger<IModelService> logger, IMapper mapper)
    {
        _providers = providers;
        _settingsService = settingsService;
        _logger = logger;
        _mapper = mapper;
    }

    public async Task<IEnumerable<ModelResponseDto>> GetModelsAsync(int userId)
    {
        var allModels = new List<ModelResponseDto>();
        var providerTypes = Enum.GetValues<ProviderType>();

        foreach (var providerType in providerTypes)
        {
            _logger.LogInformation("Trying to get provider {}", providerType.ToString());
            var provider = _providers.FirstOrDefault(p => p.Type == providerType);
            if (provider == null) continue;

            try
            {
                var settings = await _settingsService.GetFullSettingsAsync(userId, providerType);
                if (string.IsNullOrWhiteSpace(settings.ApiKey))
                {
                    _logger.LogInformation("Skipping {Provider} models for user {UserId} due to missing API key", providerType, userId);
                    continue;
                }

                var providerModels = await provider.GetModelsAsync(settings.ApiKey, settings.ApiUrl);
                allModels.AddRange(providerModels);
            }
            catch (Exception)
            {
                // Ignore providers that fail (e.g., not configured or API key is invalid)
            }
        }

        return allModels.OrderBy(m => m.Provider).ThenBy(m => m.Name);
    }

    public async Task<ModelResponseDto?> GetModelByIdAsync(int userId, string modelId)
    {
        var allModels = await GetModelsAsync(userId);
        return allModels.FirstOrDefault(m => m.Id == modelId);
    }

    public async Task<IEnumerable<ModelResponseDto>> GetModelsAsync(int userId, ProviderType providerType)
    {
        var provider = _providers.FirstOrDefault(p => p.Type == providerType);

        if (provider == null)
        {
            _logger.LogWarning("Provider of type {ProviderType} not found.", providerType);
            return Enumerable.Empty<ModelResponseDto>();
        }

        var settings = await _settingsService.GetFullSettingsAsync(userId, providerType);
        if (string.IsNullOrWhiteSpace(settings.ApiKey))
        {
            _logger.LogInformation("Skipping {Provider} models for user {UserId} due to missing API key", providerType, userId);
            return Enumerable.Empty<ModelResponseDto>();
        }

        var models = await provider.GetModelsAsync(settings.ApiKey, settings.ApiUrl);

        return models;
    }
}
