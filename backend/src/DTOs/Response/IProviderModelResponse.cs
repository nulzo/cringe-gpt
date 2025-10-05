namespace OllamaWebuiBackend.DTOs.Response;

public interface IProviderModelResponse
{
    string Id { get; set; }
    string Name { get; set; }
    string Description { get; set; }
    int ContextLength { get; set; }
}