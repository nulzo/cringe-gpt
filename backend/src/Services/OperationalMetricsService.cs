using System.Diagnostics.Metrics;
using OllamaWebuiBackend.Common;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Services;

public class OperationalMetricsService : IOperationalMetricsService
{
    private readonly Counter<long> _chatCompletionsCounter;
    private readonly Counter<long> _providerErrorsCounter;
    private readonly Histogram<double> _providerResponseTimeHistogram;
    private readonly Counter<long> _unhandledExceptionsCounter;
    private readonly Counter<long> _usersLoggedInCounter;
    private readonly Counter<long> _usersRegisteredCounter;

    public OperationalMetricsService()
    {
        var meter = new Meter(TelemetryConstants.ServiceName);

        _chatCompletionsCounter = meter.CreateCounter<long>(
            TelemetryConstants.Metrics.ChatCompletions,
            "{completion}",
            "Number of chat completions.");

        _providerResponseTimeHistogram = meter.CreateHistogram<double>(
            TelemetryConstants.Metrics.ProviderResponseTime,
            "s",
            "Measures the duration of a provider's response for a chat completion.");

        _providerErrorsCounter = meter.CreateCounter<long>(
            TelemetryConstants.Metrics.ProviderErrors,
            "{error}",
            "Number of failed chat completions from a provider.");

        _unhandledExceptionsCounter = meter.CreateCounter<long>(
            TelemetryConstants.Metrics.UnhandledExceptions,
            "{exception}",
            "Number of unhandled exceptions.");

        _usersRegisteredCounter = meter.CreateCounter<long>(
            TelemetryConstants.Metrics.UsersRegistered,
            "{user}",
            "Number of new user registrations.");

        _usersLoggedInCounter = meter.CreateCounter<long>(
            TelemetryConstants.Metrics.UsersLoggedIn,
            "{user}",
            "Number of user logins.");
    }

    public void RecordChatCompletion(string provider, string model, bool isStream)
    {
        _chatCompletionsCounter.Add(1,
            new KeyValuePair<string, object?>("provider", provider),
            new KeyValuePair<string, object?>("model", model),
            new KeyValuePair<string, object?>("stream", isStream));
    }

    public void RecordProviderResponseTime(double seconds, string provider, string model)
    {
        _providerResponseTimeHistogram.Record(seconds,
            new KeyValuePair<string, object?>("provider", provider),
            new KeyValuePair<string, object?>("model", model));
    }

    public void RecordProviderError(string provider, string model)
    {
        _providerErrorsCounter.Add(1,
            new KeyValuePair<string, object?>("provider", provider),
            new KeyValuePair<string, object?>("model", model));
    }

    public void RecordUnhandledException()
    {
        _unhandledExceptionsCounter.Add(1);
    }

    public void RecordUserRegistered()
    {
        _usersRegisteredCounter.Add(1);
    }

    public void RecordUserLoggedIn()
    {
        _usersLoggedInCounter.Add(1);
    }
}
