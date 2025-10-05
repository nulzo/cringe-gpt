using System.Net;

namespace OllamaWebuiBackend.Common;

public class ApiException : Exception
{
    public ApiException(string message, HttpStatusCode statusCode = HttpStatusCode.InternalServerError)
        : base(message)
    {
        StatusCode = statusCode;
    }

    public ApiException(string message, Exception innerException,
        HttpStatusCode statusCode = HttpStatusCode.InternalServerError)
        : base(message, innerException)
    {
        StatusCode = statusCode;
    }

    public HttpStatusCode StatusCode { get; }
}