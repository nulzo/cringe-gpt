using Microsoft.AspNetCore.Mvc;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Controllers.v1;

[ApiController]
[Route("api/v1/settings")]
public class SettingsController : BaseApiController
{
    private readonly ITagService _tagService;

    public SettingsController(ITagService tagService)
    {
        _tagService = tagService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var tags = await _tagService.GetAllAsync();
        return Ok(tags);
    }

    [HttpPost]
    public async Task<IActionResult> CreateTag()
    {
        return Ok("Not implemented.");
    }
}