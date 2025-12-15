namespace OllamaWebuiBackend.Common;

public static class Constants
{
    public static class MimeTypes
    {
        public const string TextEventStream = "text/event-stream";
        public const string ApplicationJson = "application/json";
    }

    public static class HeaderValues
    {
        public const string NoCache = "no-cache";
        public const string KeepAlive = "keep-alive";
    }

    public static class ApiRoutes
    {
        private const string ApiPrefix = "api/v1";
        public const string ChatCompletions = $"{ApiPrefix}/chat/completions";
    }

    public static class SseEvents
    {
        public const string Content = "content";
        public const string Image = "image";
        public const string Metrics = "metrics";
        public const string FinalMessage = "final_message";
        public const string Error = "error";
        public const string ConversationId = "conversation_id";
    }
}
