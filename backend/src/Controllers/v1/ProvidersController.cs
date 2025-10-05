using Microsoft.AspNetCore.Mvc;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Enums;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Controllers.v1;

#if !DEBUG
[Authorize]
#endif
[ApiController]
[Route("api/v1/providers")]
public class ProvidersController : BaseApiController
{
    private readonly IProviderSettingsService _providerSettingsService;

    public ProvidersController(IProviderSettingsService providerSettingsService)
    {
        _providerSettingsService = providerSettingsService;
    }

    [HttpGet]
    public IActionResult GetProviders()
    {
        var providers = Enum.GetNames(typeof(ProviderType));
        return Ok(providers);
    }

    [HttpGet("me/credentials/{providerType}")]
    public async Task<IActionResult> GetSettings(ProviderType providerType)
    {
        var settings = await _providerSettingsService.GetAsync(GetUserId(), providerType);
        return Ok(settings);
    }

    [HttpPost("me/credentials/{providerType}")]
    public async Task<IActionResult> UpdateSettings(ProviderType providerType, [FromBody] ProviderSettingsDto settings)
    {
        await _providerSettingsService.UpdateAsync(GetUserId(), providerType, settings);
        return NoContent();
    }
}