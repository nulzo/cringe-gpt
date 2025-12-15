namespace OllamaWebuiBackend.Services.Interfaces;

public interface ITokenizerService
{
    Task<int> GetTokenCountAsync(string model, string text);
}
