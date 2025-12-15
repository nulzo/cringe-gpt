using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Enums;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Services.Pricing;

/// <summary>
/// Ollama pricing service for local/self-hosted models
/// Supports configurable pricing for cost tracking and analytics
/// </summary>
public class OllamaPricingService : IProviderPricingService
{
    public ProviderType ProviderType => ProviderType.Ollama;

    private readonly ILogger<OllamaPricingService> _logger;

    // Default pricing configuration for Ollama models
    // Most Ollama models are free, but this allows for custom cost tracking
    private static readonly Dictionary<string, ModelPricingDto> DefaultPricing = new(StringComparer.OrdinalIgnoreCase)
    {
        // Default for all Ollama models - free by default
        ["default"] = ModelPricingDto.Free("Local Ollama model - no API costs"),

        // Specific model families with potential cloud costs if using cloud-hosted Ollama
        ["llama2"] = ModelPricingDto.Create(0, 0, "Llama 2 family models"),
        ["llama3"] = ModelPricingDto.Create(0, 0, "Llama 3 family models"),
        ["llama3.1"] = ModelPricingDto.Create(0, 0, "Llama 3.1 family models"),
        ["llama3.2"] = ModelPricingDto.Create(0, 0, "Llama 3.2 family models"),

        ["codellama"] = ModelPricingDto.Create(0, 0, "Code Llama models for coding tasks"),
        ["mistral"] = ModelPricingDto.Create(0, 0, "Mistral family models"),
        ["mixtral"] = ModelPricingDto.Create(0, 0, "Mixtral MoE models"),

        ["phi"] = ModelPricingDto.Create(0, 0, "Microsoft Phi models"),
        ["phi3"] = ModelPricingDto.Create(0, 0, "Microsoft Phi-3 models"),

        ["gemma"] = ModelPricingDto.Create(0, 0, "Google Gemma models"),
        ["gemma2"] = ModelPricingDto.Create(0, 0, "Google Gemma 2 models"),

        ["qwen"] = ModelPricingDto.Create(0, 0, "Alibaba Qwen models"),
        ["qwen2"] = ModelPricingDto.Create(0, 0, "Alibaba Qwen 2 models"),

        ["deepseek"] = ModelPricingDto.Create(0, 0, "DeepSeek models"),
        ["deepseek-r1"] = ModelPricingDto.Create(0, 0, "DeepSeek R1 reasoning models"),

        ["vicuna"] = ModelPricingDto.Create(0, 0, " LMSYS Vicuna models"),
        ["orca"] = ModelPricingDto.Create(0, 0, "Microsoft Orca models"),

        // Embedding models
        ["nomic-embed-text"] = ModelPricingDto.Create(0, 0, "Nomic embedding models"),
        ["all-minilm"] = ModelPricingDto.Create(0, 0, "Sentence Transformers embedding models"),

        // Vision models
        ["llava"] = ModelPricingDto.Create(0, 0, "LLaVA vision-language models"),
        ["bakllava"] = ModelPricingDto.Create(0, 0, "BakLLaVA vision models"),
        ["moondream"] = ModelPricingDto.Create(0, 0, "Moondream vision models")
    };

    private readonly Dictionary<string, ModelPricingDto> _customPricing;
    private readonly object _pricingLock = new();

    public OllamaPricingService(ILogger<OllamaPricingService> logger)
    {
        _logger = logger;
        _customPricing = new Dictionary<string, ModelPricingDto>(DefaultPricing, StringComparer.OrdinalIgnoreCase);
    }

    public Task<ModelPricingDto?> GetModelPricingAsync(string modelId)
    {
        lock (_pricingLock)
        {
            // Try exact match first
            if (_customPricing.TryGetValue(modelId, out var pricing))
            {
                return Task.FromResult<ModelPricingDto?>(pricing);
            }

            // Try to match by model family
            var modelFamily = GetModelFamily(modelId);
            if (!string.IsNullOrEmpty(modelFamily) && _customPricing.TryGetValue(modelFamily, out pricing))
            {
                return Task.FromResult<ModelPricingDto?>(pricing);
            }

            // Fall back to default
            return Task.FromResult<ModelPricingDto?>(_customPricing["default"]);
        }
    }

    public Task<Dictionary<string, ModelPricingDto>> GetAllModelPricingAsync()
    {
        lock (_pricingLock)
        {
            return Task.FromResult(new Dictionary<string, ModelPricingDto>(_customPricing, StringComparer.OrdinalIgnoreCase));
        }
    }

    public ModelToolingDto GetModelTooling(string modelId)
    {
        var tooling = new ModelToolingDto();

        // Ollama models typically support basic chat functionality
        tooling.SupportsChat = true;
        tooling.SupportsStreaming = true;
        tooling.PerformanceTier = "Balanced";

        // Check model family for additional capabilities
        var modelName = modelId.ToLower();
        if (modelName.Contains("llava") || modelName.Contains("bakllava") || modelName.Contains("moondream"))
        {
            tooling.SupportsVision = true;
            tooling.UseCase = "Vision-enabled conversations";
        }
        else if (modelName.Contains("codellama") || modelName.Contains("code"))
        {
            tooling.SupportsCodeExecution = true;
            tooling.UseCase = "Code generation and analysis";
        }
        else if (modelName.Contains("embedding"))
        {
            tooling.SupportsEmbeddings = true;
            tooling.UseCase = "Text embeddings";
        }
        else
        {
            tooling.UseCase = "General purpose conversations";
        }

        var modalities = new List<string>();
        if (tooling.SupportsChat) modalities.Add("text");
        if (tooling.SupportsVision) modalities.Add("image");
        tooling.SupportedModalities = modalities.Any() ? modalities : null;

        return tooling;
    }

    public async Task<decimal> CalculateCostAsync(string modelId, int promptTokens, int completionTokens)
    {
        var pricing = await GetModelPricingAsync(modelId);
        if (pricing == null)
            return 0;

        return pricing.CalculateTotalCost(promptTokens, completionTokens);
    }

    public Task<bool> RefreshPricingAsync()
    {
        // Ollama pricing is static/configurable, no dynamic refresh needed
        return Task.FromResult(false);
    }

    /// <summary>
    /// Sets custom pricing for a specific model
    /// </summary>
    public void SetModelPricing(string modelId, ModelPricingDto pricing)
    {
        lock (_pricingLock)
        {
            _customPricing[modelId] = pricing;
            _logger.LogInformation("Updated pricing for Ollama model {ModelId}: {PricingNotes}", modelId, pricing.Notes);
        }
    }

    /// <summary>
    /// Sets custom pricing for a model family (affects all models in that family)
    /// </summary>
    public void SetFamilyPricing(string family, ModelPricingDto pricing)
    {
        lock (_pricingLock)
        {
            _customPricing[family] = pricing;
            _logger.LogInformation("Updated pricing for Ollama family {Family}: {PricingNotes}", family, pricing.Notes);
        }
    }

    /// <summary>
    /// Resets pricing for a model to default
    /// </summary>
    public void ResetModelPricing(string modelId)
    {
        lock (_pricingLock)
        {
            if (DefaultPricing.TryGetValue(modelId, out var defaultPricing))
            {
                _customPricing[modelId] = defaultPricing;
                _logger.LogInformation("Reset pricing for Ollama model {ModelId} to default", modelId);
            }
            else
            {
                _customPricing.Remove(modelId);
                _logger.LogInformation("Removed custom pricing for Ollama model {ModelId}", modelId);
            }
        }
    }

    /// <summary>
    /// Gets all configured pricing (including defaults)
    /// </summary>
    public Dictionary<string, ModelPricingDto> GetAllConfiguredPricing()
    {
        lock (_pricingLock)
        {
            return new Dictionary<string, ModelPricingDto>(_customPricing);
        }
    }

    /// <summary>
    /// Extracts model family from model name for pricing lookup
    /// </summary>
    private static string? GetModelFamily(string modelName)
    {
        if (string.IsNullOrEmpty(modelName))
            return null;

        var lowerName = modelName.ToLowerInvariant();

        // Common model family patterns
        if (lowerName.Contains("llama3.2")) return "llama3.2";
        if (lowerName.Contains("llama3.1")) return "llama3.1";
        if (lowerName.Contains("llama3")) return "llama3";
        if (lowerName.Contains("llama2")) return "llama2";
        if (lowerName.Contains("llama")) return "llama2"; // fallback for llama

        if (lowerName.Contains("codellama")) return "codellama";
        if (lowerName.Contains("mistral")) return "mistral";
        if (lowerName.Contains("mixtral")) return "mixtral";

        if (lowerName.Contains("phi3")) return "phi3";
        if (lowerName.Contains("phi")) return "phi";

        if (lowerName.Contains("gemma2")) return "gemma2";
        if (lowerName.Contains("gemma")) return "gemma";

        if (lowerName.Contains("qwen2")) return "qwen2";
        if (lowerName.Contains("qwen")) return "qwen";

        if (lowerName.Contains("deepseek")) return "deepseek";

        if (lowerName.Contains("vicuna")) return "vicuna";
        if (lowerName.Contains("orca")) return "orca";

        // Embedding models
        if (lowerName.Contains("embed")) return "nomic-embed-text";
        if (lowerName.Contains("all-minilm")) return "all-minilm";

        // Vision models
        if (lowerName.Contains("llava")) return "llava";
        if (lowerName.Contains("bakllava")) return "bakllava";
        if (lowerName.Contains("moondream")) return "moondream";

        return null; // No specific family match
    }

    /// <summary>
    /// Creates pricing for cloud-hosted Ollama services (if applicable)
    /// </summary>
    public static ModelPricingDto CreateCloudPricing(decimal inputCost, decimal outputCost, string provider = "Cloud Ollama")
    {
        return new ModelPricingDto
        {
            PromptCostPerMillionTokens = inputCost,
            CompletionCostPerMillionTokens = outputCost,
            Notes = $"{provider} hosted Ollama model",
            LastUpdated = DateTimeOffset.UtcNow,
            IsDynamic = true
        };
    }
}
