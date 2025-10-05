namespace OllamaWebuiBackend.DTOs;

public class ModelPricingDto
{
    /// <summary>
    /// Cost per million input/prompt tokens in USD
    /// </summary>
    public decimal PromptCostPerMillionTokens { get; set; }

    /// <summary>
    /// Cost per million output/completion tokens in USD
    /// </summary>
    public decimal CompletionCostPerMillionTokens { get; set; }

    /// <summary>
    /// Cost per million cached input tokens (for providers that support caching)
    /// </summary>
    public decimal? CachedInputCostPerMillionTokens { get; set; }

    /// <summary>
    /// Cost per million image input tokens
    /// </summary>
    public decimal? ImageInputCostPerMillionTokens { get; set; }

    /// <summary>
    /// Cost per million image output tokens
    /// </summary>
    public decimal? ImageOutputCostPerMillionTokens { get; set; }

    /// <summary>
    /// Cost per million audio input tokens
    /// </summary>
    public decimal? AudioInputCostPerMillionTokens { get; set; }

    /// <summary>
    /// Cost per million audio output tokens
    /// </summary>
    public decimal? AudioOutputCostPerMillionTokens { get; set; }

    /// <summary>
    /// Cost per 1,000 embedding tokens (for embedding models)
    /// </summary>
    public decimal? EmbeddingCostPerThousandTokens { get; set; }

    /// <summary>
    /// Training cost per million tokens (for fine-tuning)
    /// </summary>
    public decimal? TrainingCostPerMillionTokens { get; set; }

    /// <summary>
    /// Training cost per hour (for specialized training)
    /// </summary>
    public decimal? TrainingCostPerHour { get; set; }

    /// <summary>
    /// Request-level cost (per API call)
    /// </summary>
    public decimal? RequestCost { get; set; }

    /// <summary>
    /// Web search cost per request
    /// </summary>
    public decimal? WebSearchCost { get; set; }

    /// <summary>
    /// Last updated timestamp for pricing information
    /// </summary>
    public DateTimeOffset? LastUpdated { get; set; }

    /// <summary>
    /// Notes about pricing (special conditions, etc.)
    /// </summary>
    public string? Notes { get; set; }

    /// <summary>
    /// Whether this pricing is from a dynamic source or static
    /// </summary>
    public bool IsDynamic { get; set; }

    /// <summary>
    /// Currency for pricing (defaults to USD)
    /// </summary>
    public string Currency { get; set; } = "USD";

    /// <summary>
    /// Calculates total cost for given usage
    /// </summary>
    public decimal CalculateTotalCost(int promptTokens, int completionTokens,
        int cachedInputTokens = 0, int imageInputTokens = 0, int imageOutputTokens = 0,
        int audioInputTokens = 0, int audioOutputTokens = 0, int embeddingTokens = 0,
        int requestCount = 1, int webSearchCount = 0)
    {
        decimal totalCost = 0;

        // Standard token costs
        totalCost += (promptTokens / 1_000_000m) * PromptCostPerMillionTokens;
        totalCost += (completionTokens / 1_000_000m) * CompletionCostPerMillionTokens;

        // Cached input tokens
        if (CachedInputCostPerMillionTokens.HasValue)
        {
            totalCost += (cachedInputTokens / 1_000_000m) * CachedInputCostPerMillionTokens.Value;
        }

        // Image costs
        if (ImageInputCostPerMillionTokens.HasValue)
        {
            totalCost += (imageInputTokens / 1_000_000m) * ImageInputCostPerMillionTokens.Value;
        }
        if (ImageOutputCostPerMillionTokens.HasValue)
        {
            totalCost += (imageOutputTokens / 1_000_000m) * ImageOutputCostPerMillionTokens.Value;
        }

        // Audio costs
        if (AudioInputCostPerMillionTokens.HasValue)
        {
            totalCost += (audioInputTokens / 1_000_000m) * AudioInputCostPerMillionTokens.Value;
        }
        if (AudioOutputCostPerMillionTokens.HasValue)
        {
            totalCost += (audioOutputTokens / 1_000_000m) * AudioOutputCostPerMillionTokens.Value;
        }

        // Embedding costs
        if (EmbeddingCostPerThousandTokens.HasValue)
        {
            totalCost += (embeddingTokens / 1_000m) * EmbeddingCostPerThousandTokens.Value;
        }

        // Per-request costs
        if (RequestCost.HasValue)
        {
            totalCost += requestCount * RequestCost.Value;
        }

        // Web search costs
        if (WebSearchCost.HasValue)
        {
            totalCost += webSearchCount * WebSearchCost.Value;
        }

        return totalCost;
    }

    /// <summary>
    /// Creates a simple pricing DTO for backward compatibility
    /// </summary>
    public static ModelPricingDto Create(decimal promptCost, decimal completionCost, string? notes = null)
    {
        return new ModelPricingDto
        {
            PromptCostPerMillionTokens = promptCost,
            CompletionCostPerMillionTokens = completionCost,
            Notes = notes,
            LastUpdated = DateTimeOffset.UtcNow,
            IsDynamic = false
        };
    }

    /// <summary>
    /// Creates a free pricing DTO
    /// </summary>
    public static ModelPricingDto Free(string? notes = "Free to use")
    {
        return new ModelPricingDto
        {
            PromptCostPerMillionTokens = 0,
            CompletionCostPerMillionTokens = 0,
            Notes = notes,
            LastUpdated = DateTimeOffset.UtcNow,
            IsDynamic = false
        };
    }
}

public class ModelToolingDto
{
    public bool SupportsChat { get; set; }
    public bool SupportsImages { get; set; }
    public bool SupportsEmbeddings { get; set; }
    public bool SupportsAudio { get; set; }
    public bool SupportsVision { get; set; }
    public bool SupportsVideo { get; set; }
    public bool SupportsTools { get; set; }
    public bool SupportsFunctionCalling { get; set; }
    public bool SupportsStructuredOutputs { get; set; }
    public bool SupportsStreaming { get; set; }
    public bool SupportsFineTuning { get; set; }
    public bool SupportsBatchProcessing { get; set; }
    public bool SupportsModeration { get; set; }
    public bool SupportsRealtime { get; set; }
    public bool SupportsWebSearch { get; set; }
    public bool SupportsCodeExecution { get; set; }

    // Advanced capabilities
    public List<string>? SupportedModalities { get; set; }
    public List<string>? SupportedParameters { get; set; }
    public string? InstructionFormat { get; set; }
    public string? TokenizerType { get; set; }

    // Performance characteristics
    public bool IsOptimizedForSpeed { get; set; }
    public bool IsOptimizedForQuality { get; set; }
    public bool IsExperimental { get; set; }
    public bool IsDeprecated { get; set; }

    // Additional computed properties
    public string? PerformanceTier { get; set; } // "Fast", "Balanced", "High-Quality"
    public string? UseCase { get; set; } // Primary recommended use case
}

public class ModelResponseDto
{
    public required string Id { get; set; }
    public required string Name { get; set; }
    public required string Provider { get; set; }
    public string? Description { get; set; }
    public int ContextLength { get; set; }
    public DateTimeOffset ModifiedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public long Size { get; set; }
    public string? SizeDisplay { get; set; } // Human-readable size (e.g., "4.2 GB")
    public string? Architecture { get; set; }
    public string? Family { get; set; }
    public string? ParameterSize { get; set; }
    public string? QuantizationLevel { get; set; }
    public int? MaxCompletionTokens { get; set; }
    public string? Version { get; set; }
    public string? BaseModel { get; set; }
    public bool IsAvailable { get; set; } = true;
    public bool IsDefault { get; set; }
    public bool IsExperimental { get; set; }
    public bool IsDeprecated { get; set; }
    public string? DeprecationMessage { get; set; }
    public string? RecommendedAlternative { get; set; }
    public ModelToolingDto Tooling { get; set; } = new();
    public ModelPricingDto Pricing { get; set; } = new();

    // Computed properties
    public string DisplayName => !string.IsNullOrEmpty(Name) ? Name : Id;
    public string FullName => $"{Provider}/{Id}";
    public bool HasPricing => Pricing?.PromptCostPerMillionTokens > 0 || Pricing?.CompletionCostPerMillionTokens > 0;
    public bool IsFree => !HasPricing;

    // Performance indicators
    public string? PerformanceTier { get; set; } // "Fast", "Balanced", "High-Quality"
    public string? UseCase { get; set; } // Primary recommended use case
    public List<string>? Tags { get; set; } // Categorization tags
}