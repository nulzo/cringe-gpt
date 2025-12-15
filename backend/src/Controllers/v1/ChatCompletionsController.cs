using Microsoft.AspNetCore.Mvc;
using OllamaWebuiBackend.Common;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Controllers.v1;

#if !DEBUG
//[Authorize]
#endif
[ApiController]
[Route(Constants.ApiRoutes.ChatCompletions)]
public class ChatCompletionsController : BaseApiController
{
    private readonly IChatService _chatService;
    private readonly ISseService _sseService;
    private readonly ILogger<ChatCompletionsController> _logger;

    public ChatCompletionsController(IChatService chatService, ISseService sseService, ILogger<ChatCompletionsController> logger)
    {
        _chatService = chatService;
        _sseService = sseService;
        _logger = logger;
    }

    [HttpPost]
    public async Task Post([FromBody] ChatRequestDto request)
    {
        var cancellationToken = HttpContext.RequestAborted;

        if (request.Stream)
        {
            var stream = _chatService.GetCompletionStreamAsync(GetUserId(), request, cancellationToken);
            await _sseService.ExecuteStreamAsync(stream, cancellationToken);
        }
        else
        {
            var finalMessage = await _chatService.GetCompletionAsync(GetUserId(), request, cancellationToken);
            HttpContext.Response.ContentType = Constants.MimeTypes.ApplicationJson;
            await HttpContext.Response.WriteAsJsonAsync(finalMessage, cancellationToken: cancellationToken);
        }
    }
}
