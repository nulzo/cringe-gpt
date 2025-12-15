using Microsoft.AspNetCore.Mvc;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Enums;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Controllers.v1;

#if !DEBUG
[Authorize]
#endif
[ApiController]
[Route("api/v1/models")]
public class ModelsController : BaseApiController
{
    private readonly IModelService _modelService;

    public ModelsController(IModelService modelService)
    {
        _modelService = modelService;
    }

    [HttpGet]
    public async Task<IActionResult> GetModels([FromQuery] ProviderType? provider)
    {
        IEnumerable<ModelResponseDto> models;
        if (provider.HasValue)
            models = await _modelService.GetModelsAsync(GetUserId(), provider.Value);
        else
            models = await _modelService.GetModelsAsync(GetUserId());

        return Ok(models);
    }

    [HttpGet("{modelId}")]
    public async Task<IActionResult> GetModel(string modelId)
    {
        var model = await _modelService.GetModelByIdAsync(GetUserId(), modelId);

        if (model == null)
            return NotFound();

        return Ok(model);
    }
}
