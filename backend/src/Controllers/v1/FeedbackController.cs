using Microsoft.AspNetCore.Mvc;

namespace OllamaWebuiBackend.Controllers.v1;

#if !DEBUG
[Authorize]
#endif
[Route("api/v1/feedback")]
public class FeedbackController : BaseApiController
{
    [HttpPost]
    public IActionResult Create()
    {
        return StatusCode(StatusCodes.Status501NotImplemented, "Feedback submission not implemented.");
    }

    [HttpGet]
    public IActionResult GetAll()
    {
        return StatusCode(StatusCodes.Status501NotImplemented, "Feedback retrieval not implemented.");
    }
}