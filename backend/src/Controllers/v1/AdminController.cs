using Microsoft.AspNetCore.Mvc;

namespace OllamaWebuiBackend.Controllers.v1;

[ApiController]
[Route("api/v1/admin")]
public class AdminController : BaseApiController
{
    // These endpoints would be protected by an admin-only authorization policy

    [HttpGet("users")]
    public IActionResult GetUsers()
    {
        return StatusCode(StatusCodes.Status501NotImplemented, "Admin: User list not implemented.");
    }

    [HttpGet("system/health")]
    public IActionResult GetHealth()
    {
        return StatusCode(StatusCodes.Status501NotImplemented, "Admin: System health not implemented.");
    }
}