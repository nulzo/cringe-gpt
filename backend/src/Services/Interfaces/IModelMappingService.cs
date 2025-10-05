using System.Text.Json;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.DTOs.Response;

namespace OllamaWebuiBackend.Services.Interfaces;

public interface IModelMappingService
{
    /// <summary>
    ///     Deserializes JSON content to a provider-specific model and maps it to ModelResponseDto
    /// </summary>
    /// <typeparam name="TProviderModel">The provider-specific model type that implements IProviderModelResponse</typeparam>
    /// <param name="jsonContent">The JSON content to deserialize</param>
    /// <returns>A ModelResponseDto mapped from the provider model</returns>
    Task<ModelResponseDto> MapProviderModelAsync<TProviderModel>(string jsonContent)
        where TProviderModel : class, IProviderModelResponse;

    /// <summary>
    ///     Deserializes JSON content to a provider-specific model and maps it to ModelResponseDto
    /// </summary>
    /// <typeparam name="TProviderModel">The provider-specific model type that implements IProviderModelResponse</typeparam>
    /// <param name="jsonElement">The JsonElement to deserialize</param>
    /// <returns>A ModelResponseDto mapped from the provider model</returns>
    Task<ModelResponseDto> MapProviderModelAsync<TProviderModel>(JsonElement jsonElement)
        where TProviderModel : class, IProviderModelResponse;

    /// <summary>
    ///     Deserializes JSON content to a collection of provider-specific models and maps them to ModelResponseDto
    /// </summary>
    /// <typeparam name="TProviderModel">The provider-specific model type that implements IProviderModelResponse</typeparam>
    /// <param name="jsonContent">The JSON content to deserialize</param>
    /// <returns>A collection of ModelResponseDto mapped from the provider models</returns>
    Task<IEnumerable<ModelResponseDto>> MapProviderModelsAsync<TProviderModel>(string jsonContent)
        where TProviderModel : class, IProviderModelResponse;

    /// <summary>
    ///     Maps a provider-specific model to ModelResponseDto
    /// </summary>
    /// <typeparam name="TProviderModel">The provider-specific model type that implements IProviderModelResponse</typeparam>
    /// <param name="providerModel">The provider model to map</param>
    /// <returns>A ModelResponseDto mapped from the provider model</returns>
    ModelResponseDto MapToModelResponseDto<TProviderModel>(TProviderModel providerModel)
        where TProviderModel : class, IProviderModelResponse;
}