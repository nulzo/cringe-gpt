using System.Text.Json;
using AutoMapper;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.DTOs.Response;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Services;

public class ModelMappingService : IModelMappingService
{
    private readonly JsonSerializerOptions _jsonOptions;
    private readonly ILogger<ModelMappingService> _logger;
    private readonly IMapper _mapper;

    public ModelMappingService(IMapper mapper, ILogger<ModelMappingService> logger)
    {
        _mapper = mapper;
        _logger = logger;
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
        };
    }

    public Task<ModelResponseDto> MapProviderModelAsync<TProviderModel>(string jsonContent)
        where TProviderModel : class, IProviderModelResponse
    {
        try
        {
            var providerModel = JsonSerializer.Deserialize<TProviderModel>(jsonContent, _jsonOptions);
            if (providerModel == null)
                throw new InvalidOperationException($"Failed to deserialize JSON to {typeof(TProviderModel).Name}");

            return Task.FromResult(_mapper.Map<ModelResponseDto>(providerModel));
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to deserialize JSON content to {ModelType}. Content: {JsonContent}",
                typeof(TProviderModel).Name, jsonContent);
            throw new InvalidOperationException($"Failed to deserialize JSON to {typeof(TProviderModel).Name}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to map {ModelType} to ModelResponseDto", typeof(TProviderModel).Name);
            throw;
        }
    }

    public async Task<ModelResponseDto> MapProviderModelAsync<TProviderModel>(JsonElement jsonElement)
        where TProviderModel : class, IProviderModelResponse
    {
        try
        {
            var jsonString = jsonElement.GetRawText();
            return await MapProviderModelAsync<TProviderModel>(jsonString);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process JsonElement for {ModelType}", typeof(TProviderModel).Name);
            throw;
        }
    }

    public Task<IEnumerable<ModelResponseDto>> MapProviderModelsAsync<TProviderModel>(string jsonContent)
        where TProviderModel : class, IProviderModelResponse
    {
        try
        {
            var providerModels = JsonSerializer.Deserialize<IEnumerable<TProviderModel>>(jsonContent, _jsonOptions);
            if (providerModels == null)
                return Task.FromResult(Enumerable.Empty<ModelResponseDto>());

            return Task.FromResult(providerModels.Select(model => _mapper.Map<ModelResponseDto>(model)));
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex,
                "Failed to deserialize JSON content to collection of {ModelType}. Content: {JsonContent}",
                typeof(TProviderModel).Name, jsonContent);
            throw new InvalidOperationException(
                $"Failed to deserialize JSON to collection of {typeof(TProviderModel).Name}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to map collection of {ModelType} to ModelResponseDto",
                typeof(TProviderModel).Name);
            throw;
        }
    }

    public ModelResponseDto MapToModelResponseDto<TProviderModel>(TProviderModel providerModel)
        where TProviderModel : class, IProviderModelResponse
    {
        try
        {
            return _mapper.Map<ModelResponseDto>(providerModel);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to map {ModelType} to ModelResponseDto", typeof(TProviderModel).Name);
            throw;
        }
    }
}
