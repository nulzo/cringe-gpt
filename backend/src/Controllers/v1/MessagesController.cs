using Microsoft.AspNetCore.Mvc;
using OllamaWebuiBackend.Common;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Controllers.v1;

#if !DEBUG
[Authorize]
#endif
[ApiController]
[Route("api/v1/messages")]
public class MessagesController : BaseApiController
{
    private readonly IMessageService _messageService;

    public MessagesController(IMessageService messageService)
    {
        _messageService = messageService;
    }

    /// <summary>
    /// Update message like status
    /// </summary>
    [HttpPatch("{messageId}/like")]
    public async Task<IActionResult> UpdateLikeStatus(Guid messageId, [FromBody] UpdateLikeStatusDto dto)
    {
        var userId = GetUserId();
        var result = await _messageService.UpdateLikeStatusAsync(messageId, userId, dto.IsLiked);
        return Ok(result);
    }

    /// <summary>
    /// Get message details by ID
    /// </summary>
    [HttpGet("{messageId}")]
    public async Task<IActionResult> GetMessageDetails(Guid messageId)
    {
        var userId = GetUserId();
        var message = await _messageService.GetMessageDetailsAsync(messageId, userId);
        if (message == null) return NotFound();
        return Ok(message);
    }

    /// <summary>
    /// Get message statistics for a user
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetMessageStats()
    {
        var userId = GetUserId();
        var stats = await _messageService.GetMessageStatsAsync(userId);
        return Ok(stats);
    }

    /// <summary>
    /// Get liked messages for a user
    /// </summary>
    [HttpGet("liked")]
    public async Task<IActionResult> GetLikedMessages([FromQuery] int? page = 1, [FromQuery] int? pageSize = 20)
    {
        var userId = GetUserId();
        var likedMessages = await _messageService.GetLikedMessagesAsync(userId, page, pageSize);
        return Ok(new
        {
            Data = likedMessages,
            Pagination = new
            {
                Page = page,
                PageSize = pageSize
            }
        });
    }
}

public class UpdateLikeStatusDto
{
    public bool IsLiked { get; set; }
}

public class MessageStatsDto
{
    public int TotalMessages { get; set; }
    public int LikedMessages { get; set; }
    public int AssistantMessages { get; set; }
    public int UserMessages { get; set; }
    public Dictionary<string, int> MessagesByProvider { get; set; } = new();
    public Dictionary<string, int> MessagesByModel { get; set; } = new();
}
