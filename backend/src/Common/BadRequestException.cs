using System.Net;

namespace OllamaWebuiBackend.Common;

/// <summary>
/// Exception for bad request scenarios (HTTP 400)
/// </summary>
public class BadRequestException : ApiException
{
    public BadRequestException(string message)
        : base(message, HttpStatusCode.BadRequest)
    {
    }

    public BadRequestException(string message, Exception innerException)
        : base(message, innerException, HttpStatusCode.BadRequest)
    {
    }
}
