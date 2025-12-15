using Microsoft.AspNetCore.Mvc;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Controllers.v1;

[ApiController]
[Route("api/v1/tags")]
public class TagsController : BaseApiController
{
    private readonly ITagService _tagService;

    public TagsController(ITagService tagService)
    {
        _tagService = tagService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var tags = await _tagService.GetAllAsync();
        return Ok(tags);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetTag()
    {
        return Ok("Not implemented.");
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTag()
    {
        return Ok("Not implemented.");
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> UpdateTag()
    {
        return Ok("Not implemented.");
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> ReplaceTag()
    {
        return Ok("Not implemented.");
    }

    [HttpPost]
    public async Task<IActionResult> CreateTag()
    {
        return Ok("Not implemented.");
    }
}
