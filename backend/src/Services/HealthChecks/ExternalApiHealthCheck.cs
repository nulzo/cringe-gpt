using System.Diagnostics;
using System.Net;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using OllamaWebuiBackend.Enums;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Services.HealthChecks;

public class ExternalApiHealthCheck : IHealthCheck
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<ExternalApiHealthCheck> _logger;
    private readonly IProviderSettingsService _settingsService;

    public ExternalApiHealthCheck(IHttpClientFactory httpClientFactory,
        IProviderSettingsService settingsService,
        ILogger<ExternalApiHealthCheck> logger)
    {
        _httpClientFactory = httpClientFactory;
        _settingsService = settingsService;
        _logger = logger;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var client = _httpClientFactory.CreateClient();
        var allProvidersHealthy = true;
        var results = new Dictionary<string, object>();

        foreach (ProviderType providerType in Enum.GetValues(typeof(ProviderType)))
            try
            {
                var (isHealthy, responseTime) = await CheckProviderHealth(client, providerType, cancellationToken);
                results[providerType.ToString()] = new { Healthy = isHealthy, ResponseTimeMs = responseTime };
                if (!isHealthy) allProvidersHealthy = false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to check health for provider {Provider}", providerType);
                results[providerType.ToString()] = new { Healthy = false, Error = ex.Message };
                allProvidersHealthy = false;
            }

        var status = allProvidersHealthy ? HealthStatus.Healthy : HealthStatus.Unhealthy;
        var description = allProvidersHealthy
            ? "All external APIs are reachable."
            : "One or more external APIs are unreachable.";

        return new HealthCheckResult(status, description, data: results);
    }

    private async Task<(bool, long)> CheckProviderHealth(HttpClient client, ProviderType provider,
        CancellationToken cancellationToken)
    {
        var url = GetProviderUrl(provider);
        if (string.IsNullOrEmpty(url))
        {
            // If the URL is not configured (e.g., Ollama without a specific URL), we can consider it "healthy" 
            // from a reachability perspective, or decide to fetch the specific user setting.
            // For now, we'll assume it's not a critical failure if not configured globally.
            _logger.LogInformation("No URL configured for provider {Provider}, skipping health check.", provider);
            return (true, 0);
        }

        var request = new HttpRequestMessage(HttpMethod.Get, url);
        var stopwatch = Stopwatch.StartNew();

        // We only care about reachability, not a successful API call with a key
        var response = await client.SendAsync(request, cancellationToken);

        stopwatch.Stop();
        return (response.IsSuccessStatusCode || response.StatusCode == HttpStatusCode.Unauthorized,
            stopwatch.ElapsedMilliseconds);
    }

    private string GetProviderUrl(ProviderType provider)
    {
        return provider switch
        {
            ProviderType.Ollama => _settingsService.GetDefaultApiUrl() ?? string.Empty, // This needs a method to get the default/system-wide Ollama URL
            ProviderType.OpenAi => "https://api.openai.com/v1",
            ProviderType.Anthropic => "https://api.anthropic.com/v1",
            ProviderType.OpenRouter => "https://openrouter.ai/api/v1",
            ProviderType.Google => "https://aiplatform.googleapis.com",
            _ => string.Empty
        };
    }
}
