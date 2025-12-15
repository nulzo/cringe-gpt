using Microsoft.AspNetCore.Mvc;

namespace OllamaWebuiBackend.Controllers.v1;

#if !DEBUG
[Authorize]
#endif
[Route("api/v1/export")]
public class ExportsController
{
}
