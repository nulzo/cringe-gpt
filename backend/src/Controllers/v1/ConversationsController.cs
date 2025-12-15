using Microsoft.AspNetCore.Mvc;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Controllers.v1;

#if !DEBUG
[Authorize]
#endif
[ApiController]
[Route("api/v1/conversations")]
public class ConversationsController : BaseApiController
{
    private readonly IConversationService _conversationService;

    public ConversationsController(IConversationService conversationService)
    {
        _conversationService = conversationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var summaries = await _conversationService.GetAllSummariesAsync(GetUserId());
        return Ok(summaries);
    }

    [HttpGet("pinned")]
    public async Task<IActionResult> GetPinned()
    {
        var pinnedConversations = await _conversationService.GetPinnedConversationsAsync(GetUserId());
        return Ok(pinnedConversations);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var conversation = await _conversationService.GetByIdAsync(id, GetUserId());
        if (conversation == null) return NotFound();
        return Ok(conversation);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] ConversationUpdateDto updateDto)
    {
        var updatedConversation = await _conversationService.UpdateAsync(id, GetUserId(), updateDto);
        return Ok(updatedConversation);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _conversationService.DeleteAsync(id, GetUserId());
        return NoContent();
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteMany([FromBody] IEnumerable<int> ids)
    {
        await _conversationService.DeleteManyAsync(GetUserId(), ids);
        return NoContent();
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string query, [FromQuery] string? cursor = null, [FromQuery] int pageSize = 20)
    {
        if (string.IsNullOrWhiteSpace(query)) return BadRequest("Query is required");
        var results = await _conversationService.SearchAsync(GetUserId(), query, cursor, pageSize);
        return Ok(results);
    }
}
