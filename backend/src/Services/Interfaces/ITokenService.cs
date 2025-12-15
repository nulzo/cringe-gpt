using OllamaWebuiBackend.Models;

namespace OllamaWebuiBackend.Services.Interfaces;

public interface ITokenService
{
    string CreateToken(AppUser user);
}
