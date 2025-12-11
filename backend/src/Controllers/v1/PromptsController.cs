using Microsoft.AspNetCore.Mvc;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Controllers.v1;

[ApiController]
[Route("api/v1/prompts")]
public class PromptsController : BaseApiController
{
    private readonly IPromptService _promptService;

    public PromptsController(IPromptService promptService)
    {
        _promptService = promptService;
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string? tag)
    {
        var userId = GetUserId();
        if (!string.IsNullOrEmpty(tag)) return Ok(await _promptService.GetByTagAsync(tag, userId));

        return Ok(await _promptService.GetAllAsync(userId));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var prompt = await _promptService.GetByIdAsync(id, GetUserId());
        return prompt == null ? NotFound() : Ok(prompt);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PromptCreateDto createDto)
    {
        var created = await _promptService.CreateAsync(GetUserId(), createDto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] PromptUpdateDto updateDto)
    {
        var updated = await _promptService.UpdateAsync(id, GetUserId(), updateDto);
        return updated == null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await _promptService.DeleteAsync(id, GetUserId());
        return success ? NoContent() : NotFound();
    }
}