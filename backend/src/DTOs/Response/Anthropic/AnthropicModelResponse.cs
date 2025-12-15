namespace OllamaWebuiBackend.DTOs.Response.Anthropic;

public class AnthropicModelResponseItem : IProviderModelResponse
{
    public string? DisplayName { get; set; }
    public DateTime CreatedAt { get; set; }
    public string Type { get; set; }
    public string Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public int ContextLength { get; set; }
}

public class AnthropicModelResponse
{
    public List<AnthropicModelResponseItem> Data { get; set; }
    public string FirstId { get; set; }
    public bool HasMore { get; set; }
    public string LastId { get; set; }
}
