using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Controllers.v1;

#if !DEBUG
[Authorize]
#endif
[ApiController]
[Route("api/v1/images")]
public class ImagesController : BaseApiController
{
    private readonly IImageGenerationService _imageGenerationService;

    public ImagesController(IImageGenerationService imageGenerationService)
    {
        _imageGenerationService = imageGenerationService;
    }

    [HttpPost("generations")]
    public async Task<IActionResult> GenerateImage([FromBody] ImageGenerationRequestDto request)
    {
        var cancellationToken = HttpContext.RequestAborted;
        var response = await _imageGenerationService.GenerateImageAsync(GetUserId(), request, cancellationToken);
        return Ok(response);
    }
}
