using Microsoft.AspNetCore.Mvc;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Controllers.v1;

[Route("api/v1/auth")]
public class AuthController : BaseApiController
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto registerDto)
    {
        var response = await _authService.RegisterAsync(registerDto);
        return Ok(response);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginDto loginDto)
    {
        var response = await _authService.LoginAsync(loginDto);
        return Ok(response);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await _authService.LogoutAsync();
        return NoContent();
    }
}
