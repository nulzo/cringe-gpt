using OllamaWebuiBackend.Data;
using OllamaWebuiBackend.Services;
using OllamaWebuiBackend.Services.HealthChecks;
using OllamaWebuiBackend.Services.Interfaces;
using OllamaWebuiBackend.Services.Pricing;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

namespace OllamaWebuiBackend.Common;

public static class DependencyInjection
{
    public static IServiceCollection AddTelemetry(this IServiceCollection services, IConfiguration configuration)
    {
        var resourceBuilder = ResourceBuilder.CreateDefault().AddService(TelemetryConstants.ServiceName);

        services.AddOpenTelemetry()
            .WithTracing(tracerProviderBuilder =>
                tracerProviderBuilder
                    .SetResourceBuilder(resourceBuilder)
                    .AddSource(TelemetryConstants.ServiceName)
                    .AddHttpClientInstrumentation()
                    .AddAspNetCoreInstrumentation()
                    .AddEntityFrameworkCoreInstrumentation()
                    .AddConsoleExporter()
                    .AddOtlpExporter(opt =>
                    {
                        opt.Endpoint = new Uri(configuration["Otlp:Endpoint"] ?? "http://localhost:4317");
                    }))
            .WithMetrics(metricsProviderBuilder =>
                metricsProviderBuilder
                    .SetResourceBuilder(resourceBuilder)
                    .AddHttpClientInstrumentation()
                    .AddAspNetCoreInstrumentation()
                    .AddRuntimeInstrumentation()
                    .AddMeter(TelemetryConstants.ServiceName)
                    .AddPrometheusExporter());

        return services;
    }

    public static IServiceCollection AddHealthCheckServices(this IServiceCollection services)
    {
        services.AddHealthChecks()
            .AddDbContextCheck<AppDbContext>("database")
            .AddCheck<DiskSpaceHealthCheck>("disk_space")
            .AddCheck<ExternalApiHealthCheck>("external_apis", tags: new[] { "live" });

        return services;
    }

    public static IServiceCollection AddModelMappingService(this IServiceCollection services)
    {
        services.AddScoped<IModelMappingService, ModelMappingService>();
        return services;
    }

    public static IServiceCollection AddPricingServices(this IServiceCollection services)
    {
        // Register pricing services
        services.AddScoped<OpenAiPricingService>();
        services.AddScoped<AnthropicPricingService>();
        services.AddScoped<GooglePricingService>();
        services.AddScoped<OllamaPricingService>();
        services.AddScoped<OpenRouterPricingService>();

        // Register pricing service interface mappings
        services.AddScoped<IProviderPricingService>(sp => sp.GetRequiredService<OpenAiPricingService>());
        services.AddScoped<IProviderPricingService>(sp => sp.GetRequiredService<AnthropicPricingService>());
        services.AddScoped<IProviderPricingService>(sp => sp.GetRequiredService<GooglePricingService>());
        services.AddScoped<IProviderPricingService>(sp => sp.GetRequiredService<OllamaPricingService>());
        services.AddScoped<IProviderPricingService>(sp => sp.GetRequiredService<OpenRouterPricingService>());

        return services;
    }
}
