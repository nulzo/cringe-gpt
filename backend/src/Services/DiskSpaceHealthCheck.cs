using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace OllamaWebuiBackend.Services;

public class DiskSpaceHealthCheck : IHealthCheck
{
    private readonly ILogger<DiskSpaceHealthCheck> _logger;
    private readonly long _thresholdGb;

    public DiskSpaceHealthCheck(ILogger<DiskSpaceHealthCheck> logger, IConfiguration configuration)
    {
        _logger = logger;
        _thresholdGb = configuration.GetValue<long>("HealthChecks:DiskSpace:ThresholdGb", 1);
    }

    public Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var driveInfo = new DriveInfo(Path.GetPathRoot(Environment.CurrentDirectory) ?? string.Empty);
            var freeSpaceGb = driveInfo.AvailableFreeSpace / (1024.0 * 1024.0 * 1024.0);

            if (freeSpaceGb < _thresholdGb)
            {
                _logger.LogWarning("Low disk space: {FreeSpaceGb}GB remaining. Threshold is {ThresholdGb}GB.",
                    freeSpaceGb, _thresholdGb);
                return Task.FromResult(HealthCheckResult.Unhealthy(
                    $"Low disk space. Only {freeSpaceGb:F2} GB remaining. Threshold is {_thresholdGb}GB"));
            }

            _logger.LogInformation("Sufficient disk space: {FreeSpaceGb}GB remaining. Threshold is {ThresholdGb}GB.",
                freeSpaceGb, _thresholdGb);
            return Task.FromResult(HealthCheckResult.Healthy(
                $"Sufficient disk space. {freeSpaceGb:F2} GB remaining. Threshold is {_thresholdGb}GB."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to check disk space.");
            return Task.FromResult(HealthCheckResult.Unhealthy("Failed to check disk space.", ex));
        }
    }
}