using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Controllers.v1;

[Authorize(Roles = "Admin")]
[Route("api/v1/reports")]
public class ReportsController : BaseApiController
{
    private readonly HealthCheckService _healthCheckService;
    private readonly IOperationalMetricsService _metricsService;

    public ReportsController(HealthCheckService healthCheckService, IOperationalMetricsService metricsService)
    {
        _healthCheckService = healthCheckService;
        _metricsService = metricsService;
    }

    [HttpGet("health")]
    public async Task<IActionResult> GetHealthReport()
    {
        var report = await _healthCheckService.CheckHealthAsync();
        return Ok(report);
    }

    // This is a placeholder. In a real app, you would have a more sophisticated way
    // of querying and aggregating metrics. For this example, we'll return a simple object.
    [HttpGet("metrics")]
    public IActionResult GetOperationalMetrics()
    {
        // This is highly simplified. A real implementation would query the metrics from the underlying store
        // (e.g., Prometheus) or have the service cache them.
        // For now, we don't have a direct way to get the *current* values of the counters,
        // so we will just return a placeholder. The real value is in the Grafana dashboard.
        var metrics = new
        {
            Note = "Metrics are exported to Prometheus. This is a placeholder for a future in-app metrics view."
        };
        return Ok(metrics);
    }
}
