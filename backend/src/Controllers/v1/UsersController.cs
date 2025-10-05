using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Controllers.v1;

[Authorize]
[ApiController]
[Route("api/v1/users")]
public class UsersController : BaseApiController
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet("me")]
    [EnableRateLimiting("fixedRateLimit")]
    public async Task<ActionResult<UserProfileDto>> GetMe()
    {
        var userId = GetUserId();
        var user = await _userService.GetProfileAsync(userId);
        return Ok(user);
    }

    [HttpPatch("me")]
    public async Task<ActionResult<UserDto>> UpdateMe([FromBody] UserUpdateDto updateDto)
    {
        var userId = GetUserId();
        var user = await _userService.UpdateProfileAsync(userId, updateDto);
        return Ok(user);
    }

    [HttpDelete("me")]
    public async Task<IActionResult> DeleteMe()
    {
        await _userService.DeleteUserAsync(GetUserId());
        return NoContent();
    }

    [HttpGet("{userId}")]
    public async Task<ActionResult<UserDto>> GetById(int userId)
    {
        var user = await _userService.GetProfileAsync(userId);
        return user == null ? NotFound() : Ok(user);
    }
}