namespace OllamaWebuiBackend.DTOs.Response.Ollama;

public class OllamaModelListDetailsItem
{
    public string Format { get; set; }
    public string Family { get; set; }
    public List<string>? Families { get; set; }
    public string ParameterSize { get; set; }
    public string QuantizationLevel { get; set; }
}

public class OllamaModelListResponseItem : IProviderModelResponse
{
    public DateTime ModifiedAt { get; set; }
    public long Size { get; set; }
    public string Digest { get; set; }
    public OllamaModelListDetailsItem Details { get; set; }
    public string Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public int ContextLength { get; set; }
}

public class OllamaModelListResponse
{
    public List<OllamaModelListResponseItem> Models { get; set; }
}

public class OllamaModelShowDetails
{
    public string ParentModel { get; set; }
    public string Format { get; set; }
    public string Family { get; set; }
    public List<string> Families { get; set; }
    public string ParameterSize { get; set; }
    public string QuantizationLevel { get; set; }
}

public class OllamaModelShowInfo
{
    public string GeneralArchitecture { get; set; }
    public int GeneralFileType { get; set; }
    public long GeneralParameterCount { get; set; }
    public int GeneralQuantizationVersion { get; set; }
    public int LlamaAttentionHeadCount { get; set; }
    public int LlamaAttentionHeadCountKv { get; set; }
    public double LlamaAttentionLayerNormRmsEpsilon { get; set; }
    public int LlamaBlockCount { get; set; }
    public int LlamaContextLength { get; set; }
    public int LlamaEmbeddingLength { get; set; }
    public int LlamaFeedForwardLength { get; set; }
    public int LlamaRopeDimensionCount { get; set; }
    public double LlamaRopeFreqBase { get; set; }
    public int LlamaVocabSize { get; set; }
    public int TokenizerGgmlBosTokenId { get; set; }
    public int TokenizerGgmlEosTokenId { get; set; }
    public List<string> TokenizerGgmlMerges { get; set; }
    public string TokenizerGgmlModel { get; set; }
    public string TokenizerGgmlPre { get; set; }
    public List<string> TokenizerGgmlTokenType { get; set; }
    public List<string> TokenizerGgmlTokens { get; set; }
}

public class OllamaModelShowResponse
{
    public string Modelfile { get; set; }
    public string Parameters { get; set; }
    public string Template { get; set; }
    public OllamaModelShowInfo Details { get; set; }
    public OllamaModelShowDetails OllamaModelShowDetails { get; set; }
}
