using System.Net;
using System.Text.Json;
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

        var errorResponse = new
        {
            message = "An unexpected error occurred.",
            details = ""
        };

        switch (exception)
        {
            case ApiException apiException:
                response.StatusCode = (int)apiException.StatusCode;
                errorResponse = new { message = apiException.Message, details = apiException.ToString() };
                break;
            case FormatException formatException when formatException.Message.Contains("Guid"):
                // Handle Guid parsing errors specifically
                response.StatusCode = (int)HttpStatusCode.BadRequest;
                errorResponse = new { message = "Invalid GUID format", details = formatException.Message };
                break;
            case ArgumentException argException when argException.Message.Contains("ID") || argException.Message.Contains("Id"):
                // Handle ID-related argument exceptions
                response.StatusCode = (int)HttpStatusCode.BadRequest;
                errorResponse = new { message = "Invalid ID format", details = argException.Message };
                break;
            default:
                response.StatusCode = (int)HttpStatusCode.InternalServerError;
                errorResponse = new { message = "Internal Server Error", details = exception.ToString() };
                break;
        }

        _logger.LogError(exception, "An unhandled exception has occurred.");
        var result = JsonSerializer.Serialize(errorResponse);
        await context.Response.WriteAsync(result);
    }
}