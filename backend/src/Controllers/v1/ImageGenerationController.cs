using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Controllers.v1;

[ApiController]
[Route("api/v1/images")]
public class ImageGenerationController : BaseApiController
{
    private readonly IImageGenerationService _imageGenerationService;

    public ImageGenerationController(IImageGenerationService imageGenerationService)
    {
        _imageGenerationService = imageGenerationService;
    }

    [HttpPost("generate")]
    public async Task<ActionResult<ImageGenerationResponseDto>> GenerateImage(
        ImageGenerationRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var result = await _imageGenerationService.GenerateImageAsync(userId, request, cancellationToken);
        return Ok(result);
    }
}
