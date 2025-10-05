namespace OllamaWebuiBackend.Services.Interfaces;

public interface IOperationalMetricsService
{
    void RecordChatCompletion(string provider, string model, bool isStream);
    void RecordProviderResponseTime(double seconds, string provider, string model);
    void RecordProviderError(string provider, string model);
    void RecordUnhandledException();
    void RecordUserRegistered();
    void RecordUserLoggedIn();
}