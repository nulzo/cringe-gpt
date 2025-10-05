using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace OllamaWebuiBackend.Controllers.v1;

[ApiController]
[Route("api/v1/[controller]")]
public class BaseApiController : ControllerBase
{
    protected int GetUserId()
    {
#if DEBUG
        // In Debug mode, if no user is authenticated, default to user ID 1 for easy testing.
        if (!(User.Identity?.IsAuthenticated ?? false)) return 1;
#endif

        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out var userId))
            // This case should ideally not be reached if the endpoint is protected by [Authorize]
            throw new UnauthorizedAccessException("User is not authenticated or user ID is invalid.");
        return userId;
    }
}