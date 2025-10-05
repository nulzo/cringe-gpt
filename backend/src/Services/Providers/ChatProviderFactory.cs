using System.Net;
using OllamaWebuiBackend.Common;
using OllamaWebuiBackend.Enums;
using OllamaWebuiBackend.Services.Providers.Interfaces;

namespace OllamaWebuiBackend.Services.Providers;

public class ChatProviderFactory
{
    private readonly IServiceProvider _serviceProvider;

    public ChatProviderFactory(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public IChatProvider CreateProvider(ProviderType providerType)
    {
        var providers = _serviceProvider.GetServices<IChatProvider>();
        var provider = providers.FirstOrDefault(p => p.Type == providerType);

        if (provider == null)
            throw new ApiException($"Provider '{providerType}' is not supported.", HttpStatusCode.BadRequest);

        return provider;
    }
}