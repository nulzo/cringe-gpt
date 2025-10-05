using System.Net;
using Microsoft.AspNetCore.Identity;
using OllamaWebuiBackend.Common;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Models;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Services;

public class AuthService : IAuthService
{
    private readonly IOperationalMetricsService _operationalMetricsService;
    private readonly ITokenService _tokenService;
    private readonly UserManager<AppUser> _userManager;

    public AuthService(UserManager<AppUser> userManager, ITokenService tokenService,
        IOperationalMetricsService operationalMetricsService)
    {
        _userManager = userManager;
        _tokenService = tokenService;
        _operationalMetricsService = operationalMetricsService;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto)
    {
        var user = new AppUser
        {
            UserName = registerDto.Username,
            Email = registerDto.Email,
            Settings = new UserSettings() // Create default settings
        };

        var result = await _userManager.CreateAsync(user, registerDto.Password);

        if (!result.Succeeded)
        {
            var errorDescription = string.Join(", ", result.Errors.Select(e => e.Description));
            throw new ApiException($"User creation failed: {errorDescription}", HttpStatusCode.BadRequest);
        }

        _operationalMetricsService.RecordUserRegistered();

        return new AuthResponseDto
        {
            Username = user.UserName,
            Email = user.Email,
            Token = _tokenService.CreateToken(user),
            Id = user.Id,
            Avatar = user.Avatar
        };
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto)
    {
        var user = await FindUserAsync(loginDto.UsernameOrEmail);

        if (user == null) throw new ApiException("Invalid credentials.", HttpStatusCode.Unauthorized);

        var result = await _userManager.CheckPasswordAsync(user, loginDto.Password);
        if (!result) throw new ApiException("Invalid credentials.", HttpStatusCode.Unauthorized);

        _operationalMetricsService.RecordUserLoggedIn();

        return new AuthResponseDto
        {
            Username = user.UserName,
            Email = user.Email!,
            Token = _tokenService.CreateToken(user),
            Id = user.Id,
            Avatar = user.Avatar
        };
    }

    private async Task<AppUser?> FindUserAsync(string usernameOrEmail)
    {
        if (usernameOrEmail.Contains('@')) return await _userManager.FindByEmailAsync(usernameOrEmail);

        return await _userManager.FindByNameAsync(usernameOrEmail);
    }
}