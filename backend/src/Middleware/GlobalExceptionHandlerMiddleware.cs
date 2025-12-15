using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using OllamaWebuiBackend.Common;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Middleware;

public class GlobalExceptionHandlerMiddleware
{
    private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;
    private readonly RequestDelegate _next;
    private readonly IOperationalMetricsService _operationalMetricsService;

    public GlobalExceptionHandlerMiddleware(RequestDelegate next, ILogger<GlobalExceptionHandlerMiddleware> logger,
        IOperationalMetricsService operationalMetricsService)
    {
        _next = next;
        _logger = logger;
        _operationalMetricsService = operationalMetricsService;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _operationalMetricsService.RecordUnhandledException();
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        var response = context.Response;

        var problem = CreateProblemDetails(context, exception);

        _logger.LogError(exception, "Unhandled exception");

        var result = JsonSerializer.Serialize(problem);
        response.StatusCode = problem.Status ?? (int)HttpStatusCode.InternalServerError;
        await context.Response.WriteAsync(result);
    }

    private static ProblemDetails CreateProblemDetails(HttpContext context, Exception exception)
    {
        var traceId = context.TraceIdentifier;

        ProblemDetails Build(HttpStatusCode status, string title, string detail, string code) =>
            new()
            {
                Status = (int)status,
                Title = title,
                Detail = detail,
                Extensions =
                {
                    ["code"] = code,
                    ["traceId"] = traceId
                }
            };

        return exception switch
        {
            ApiException apiEx => Build(apiEx.StatusCode, apiEx.Message, apiEx.ToString(), "api_error"),
            FormatException fmt when fmt.Message.Contains("Guid", StringComparison.OrdinalIgnoreCase)
                => Build(HttpStatusCode.BadRequest, "Invalid GUID format", fmt.Message, "invalid_guid"),
            ArgumentException arg when arg.Message.Contains("ID", StringComparison.OrdinalIgnoreCase)
                                     || arg.Message.Contains("Id", StringComparison.OrdinalIgnoreCase)
                => Build(HttpStatusCode.BadRequest, "Invalid identifier", arg.Message, "invalid_id"),
            _ => Build(HttpStatusCode.InternalServerError, "Internal Server Error", exception.Message, "unhandled_error")
        };
    }
}
