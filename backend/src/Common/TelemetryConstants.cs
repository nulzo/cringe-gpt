namespace OllamaWebuiBackend.Common;

public static class TelemetryConstants
{
    public const string ServiceName = "OllamaWebuiBackend";

    public static class Metrics
    {
        public const string ChatCompletions = "app.chat.completions";
        public const string ProviderResponseTime = "app.provider.response_time";
        public const string ProviderErrors = "app.provider.errors";
        public const string UnhandledExceptions = "app.exceptions.unhandled";
        public const string UsersRegistered = "app.users.registered";
        public const string UsersLoggedIn = "app.users.loggedin";
    }
}
