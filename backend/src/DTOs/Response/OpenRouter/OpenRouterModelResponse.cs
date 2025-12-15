namespace OllamaWebuiBackend.DTOs.Response.OpenRouter;

public class OpenRouterModelResponseItem : IProviderModelResponse
{
    public long Created { get; set; }
    public OpenRouterModelArchitectureInfo Architecture { get; set; }
    public OpenRouterModelTopProviderInfo TopProvider { get; set; }
    public OpenRouterModelPricingInfo Pricing { get; set; }
    public string CanonicalSlug { get; set; }
    public string? HuggingFaceId { get; set; }
    public Dictionary<string, string>? PerRequestLimits { get; set; }
    public List<string> SupportedParameters { get; set; }
    public string Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public int ContextLength { get; set; }
}

public class OpenRouterModelArchitectureInfo
{
    public List<string> InputModalities { get; set; }
    public List<string> OutputModalities { get; set; }
    public string Tokenizer { get; set; }
    public string Modality { get; set; }
    public string? InstructType { get; set; }
}

public class OpenRouterModelTopProviderInfo
{
    public bool IsModerated { get; set; }
    public int? ContextLength { get; set; }
    public int? MaxCompletionTokens { get; set; }
}

public class OpenRouterModelPricingInfo
{
    public string Prompt { get; set; }
    public string Completion { get; set; }
    public string? Image { get; set; }
    public string? Request { get; set; }
    public string? WebSearch { get; set; }
    public string? InternalReasoning { get; set; }
}

public class OpenRouterModelResponse
{
    public List<OpenRouterModelResponseItem> Data { get; set; }
}
