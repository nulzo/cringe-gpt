using System.Net;
using OllamaWebuiBackend.Common;
using OllamaWebuiBackend.Enums;
using OllamaWebuiBackend.Services.Providers.Interfaces;

namespace OllamaWebuiBackend.Services.Providers;

public class ImageGenerationProviderFactory
{
    private readonly IServiceProvider _serviceProvider;

    public ImageGenerationProviderFactory(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public IImageGenerationProvider CreateProvider(ProviderType providerType, string modelId)
    {
        var providers = _serviceProvider.GetServices<IImageGenerationProvider>().ToList();
        
        var provider = providers.FirstOrDefault(p => p.Type == providerType);

        if (provider == null)
            throw new ApiException($"Provider of type '{providerType}' is not supported for image generation.", HttpStatusCode.BadRequest);

        return provider;
    }
} 