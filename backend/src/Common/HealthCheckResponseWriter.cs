using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace OllamaWebuiBackend.Common;

public static class HealthCheckResponseWriter
{
    public static Task WriteResponse(HttpContext context, HealthReport report)
    {
        context.Response.ContentType = "application/json; charset=utf-8";

        var options = new JsonSerializerOptions
        {
            WriteIndented = true,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };
        options.Converters.Add(new JsonStringEnumConverter());

        var response = new
        {
            Status = report.Status.ToString(),
            report.TotalDuration,
            Results = report.Entries.ToDictionary(
                e => e.Key,
                e => new
                {
                    Status = e.Value.Status.ToString(),
                    e.Value.Description,
                    e.Value.Duration,
                    Exception = e.Value.Exception?.Message,
                    e.Value.Data
                })
        };

        return context.Response.WriteAsync(JsonSerializer.Serialize(response, options));
    }
}
