using AutoMapper;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.DTOs.Response.Anthropic;
using OllamaWebuiBackend.DTOs.Response.Ollama;
using OllamaWebuiBackend.DTOs.Response.OpenRouter;
using OllamaWebuiBackend.Models;
using OllamaWebuiBackend.Services.Providers.Models;

namespace OllamaWebuiBackend.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // Tag Mappings
        CreateMap<Tag, TagDto>();

        // Prompt Mappings
        CreateMap<Prompt, PromptDto>();

        // CannedQuestion Mappings
        CreateMap<CannedQuestion, CannedQuestionDto>();
        CreateMap<CannedQuestionCreateDto, CannedQuestion>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());

        // Chat Mappings - REMOVE THE DUPLICATE AND KEEP ONLY THIS ONE
        CreateMap<ChatRequestDto, ChatRequest>()
            .ForMember(dest => dest.ProviderType, opt => opt.MapFrom(src => src.Provider))
            .ForMember(dest => dest.Model, opt => opt.Ignore()) // Will be provided at runtime
            .ForMember(dest => dest.Messages, opt => opt.Ignore()) // Will be provided at runtime
            .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.UserId))
            .ForMember(dest => dest.SystemPrompt, opt => opt.MapFrom(src => src.SystemPrompt));


        CreateMap<ChatRequestDto, Message>()
            .ForMember(dest => dest.Role, opt => opt.MapFrom(src => "user"))
            .ForMember(dest => dest.Content, opt => opt.MapFrom(src => src.Message))
            .ForMember(dest => dest.Attachments, opt => opt.Ignore()) // Ignore this - we'll handle it manually
            .ForMember(dest => dest.HasImages, opt => opt.MapFrom(src => src.Attachments != null && src.Attachments.Any()));

        // Message and Conversation Mappings
        CreateMap<Message, MessageDto>()
    .ForMember(dest => dest.Images, opt => opt.MapFrom(src => MapMessageImages(src)))
    .AfterMap((src, dest) => {
        // If we have processed images, replace the regular images array
        var processedImages = MapMessageImages(src);
        if (processedImages != null && processedImages.Any())
        {
            dest.Images = processedImages;
        }
    });

        CreateMap<Conversation, ConversationDetailDto>();
        CreateMap<Conversation, ConversationSummaryDto>();

        // User Mappings
        CreateMap<AppUser, UserDto>();
        CreateMap<UserSettings, UserSettingsDto>();

        // Organization & Project Mappings
        CreateMap<Organization, OrganizationDto>();
        CreateMap<Organization, OrganizationDetailDto>();
        CreateMap<OrganizationMember, OrganizationMemberDto>();
        CreateMap<Project, ProjectDto>();

        // Provider Specific Model Mappings
        CreateMap<OllamaModelListResponseItem, ModelResponseDto>()
            .ForMember(dest => dest.Provider, opt => opt.MapFrom(src => "Ollama"))
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.ModifiedAt))
            .ForMember(dest => dest.ModifiedAt, opt => opt.MapFrom(src => src.ModifiedAt))
            .ForMember(dest => dest.Size, opt => opt.MapFrom(src => src.Size))
            .ForMember(dest => dest.SizeDisplay, opt => opt.MapFrom(src => FormatSize(src.Size)))
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Name))
            .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
            .ForMember(dest => dest.Description, opt => opt.MapFrom(src => MapOllamaDescription(src)))
            .ForMember(dest => dest.ContextLength, opt => opt.MapFrom(src => src.ContextLength))
            .ForMember(dest => dest.Architecture, opt => opt.MapFrom(src => src.Details != null ? src.Details.Format : null))
            .ForMember(dest => dest.Family, opt => opt.MapFrom(src => src.Details != null ? src.Details.Family : null))
            .ForMember(dest => dest.ParameterSize, opt => opt.MapFrom(src => src.Details != null ? src.Details.ParameterSize : null))
            .ForMember(dest => dest.QuantizationLevel, opt => opt.MapFrom(src => src.Details != null ? src.Details.QuantizationLevel : null))
            .ForMember(dest => dest.Tooling, opt => opt.MapFrom(src => MapOllamaTooling(src)))
            .ForMember(dest => dest.Pricing, opt => opt.MapFrom(src => ModelPricingDto.Free("Local Ollama model")))
            .ForMember(dest => dest.IsAvailable, opt => opt.MapFrom(src => true))
            .ForMember(dest => dest.IsExperimental, opt => opt.MapFrom(src => false))
            .ForMember(dest => dest.IsDeprecated, opt => opt.MapFrom(src => false));

        CreateMap<OpenRouterModelResponseItem, ModelResponseDto>()
            .ForMember(dest => dest.Provider, opt => opt.MapFrom(src => "OpenRouter"))
            .ForMember(dest => dest.CreatedAt,
                opt => opt.MapFrom(src => DateTimeOffset.FromUnixTimeSeconds(src.Created)))
            .ForMember(dest => dest.ModifiedAt,
                opt => opt.MapFrom(src => DateTimeOffset.FromUnixTimeSeconds(src.Created)))
            .ForMember(dest => dest.Size, opt => opt.MapFrom(src => 0))
            .ForMember(dest => dest.SizeDisplay, opt => opt.MapFrom(src => "N/A"))
            .ForMember(dest => dest.Architecture, opt => opt.MapFrom(src => src.Architecture != null ? src.Architecture.Tokenizer : "Unknown"))
            .ForMember(dest => dest.Family, opt => opt.MapFrom(src => "OpenRouter"))
            .ForMember(dest => dest.ParameterSize, opt => opt.MapFrom(src => "N/A"))
            .ForMember(dest => dest.QuantizationLevel, opt => opt.MapFrom(src => "N/A"))
            .ForMember(dest => dest.MaxCompletionTokens, opt => opt.MapFrom(src => src.TopProvider != null ? src.TopProvider.MaxCompletionTokens : null))
            .ForMember(dest => dest.Tooling, opt => opt.MapFrom(src => MapOpenRouterTooling(src.Architecture)))
            .ForMember(dest => dest.Pricing, opt => opt.MapFrom(src => MapOpenRouterPricing(src.Pricing)))
            .ForMember(dest => dest.IsAvailable, opt => opt.MapFrom(src => true))
            .ForMember(dest => dest.IsExperimental, opt => opt.MapFrom(src => false))
            .ForMember(dest => dest.IsDeprecated, opt => opt.MapFrom(src => false));

        CreateMap<AnthropicModelResponseItem, ModelResponseDto>()
            .ForMember(dest => dest.Provider, opt => opt.MapFrom(src => "Anthropic"))
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt))
            .ForMember(dest => dest.ModifiedAt, opt => opt.MapFrom(src => src.CreatedAt))
            .ForMember(dest => dest.Size, opt => opt.MapFrom(src => 0))
            .ForMember(dest => dest.SizeDisplay, opt => opt.MapFrom(src => "N/A"))
            .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.DisplayName ?? src.Id))
            .ForMember(dest => dest.Description, opt => opt.MapFrom(src => MapAnthropicDescription(src)))
            .ForMember(dest => dest.ContextLength, opt => opt.MapFrom(src => src.ContextLength))
            .ForMember(dest => dest.Architecture, opt => opt.MapFrom(src => "Claude"))
            .ForMember(dest => dest.Family, opt => opt.MapFrom(src => src.Type ?? "Claude"))
            .ForMember(dest => dest.ParameterSize, opt => opt.MapFrom(src => "N/A"))
            .ForMember(dest => dest.QuantizationLevel, opt => opt.MapFrom(src => "N/A"))
            .ForMember(dest => dest.Tooling, opt => opt.MapFrom(src => MapAnthropicTooling(src)))
            .ForMember(dest => dest.Pricing, opt => opt.MapFrom(src => MapAnthropicPricing(src)))
            .ForMember(dest => dest.IsAvailable, opt => opt.MapFrom(src => true))
            .ForMember(dest => dest.IsExperimental, opt => opt.MapFrom(src => false))
            .ForMember(dest => dest.IsDeprecated, opt => opt.MapFrom(src => false));
    }

    private static string MapOllamaDescription(OllamaModelListResponseItem src)
    {
        var parts = new List<string>();
        if (src.Details?.Family != null)
            parts.Add($"Family: {src.Details.Family}");
        if (src.Details?.ParameterSize != null)
            parts.Add($"Parameters: {src.Details.ParameterSize}");
        if (src.Details?.QuantizationLevel != null)
            parts.Add($"Quantization: {src.Details.QuantizationLevel}");

        return parts.Count > 0 ? string.Join(", ", parts) : string.Empty;
    }

    private static ModelToolingDto MapOllamaTooling(OllamaModelListResponseItem src)
    {
        var tooling = new ModelToolingDto
        {
            SupportsChat = true,
            SupportsImages = false, // Most Ollama models don't support images by default
            SupportsVision = false,
            SupportsEmbeddings = false,
            SupportsAudio = false,
            SupportsVideo = false,
            SupportsTools = false,
            SupportsFunctionCalling = false,
            SupportsStructuredOutputs = false,
            SupportsStreaming = true,
            SupportsFineTuning = false,
            SupportsBatchProcessing = false,
            SupportsModeration = false,
            SupportsRealtime = false,
            SupportsWebSearch = false,
            SupportsCodeExecution = false,
            IsOptimizedForSpeed = false,
            IsOptimizedForQuality = true,
            IsExperimental = false,
            IsDeprecated = false
        };

        // Enhanced capabilities based on model details
        if (src.Details != null && src.Details.Family != null)
        {
            var family = src.Details.Family.ToLower();
            if (family.Contains("llava") || family.Contains("bakllava") || family.Contains("moondream"))
            {
                tooling.SupportsImages = true;
                tooling.SupportsVision = true;
                tooling.SupportedModalities = new List<string> { "text", "image" };
                tooling.UseCase = "Vision-language tasks";
            }

            if (family.Contains("codellama") || family.Contains("deepseek") || family.Contains("qwen"))
            {
                tooling.SupportsCodeExecution = true;
                tooling.UseCase = "Code generation and analysis";
            }

            if (family.Contains("embedding") || family.Contains("embed"))
            {
                tooling.SupportsEmbeddings = true;
                tooling.UseCase = "Text embeddings";
            }
        }

        return tooling;
    }

    private static ModelToolingDto MapOpenRouterTooling(OpenRouterModelArchitectureInfo architecture)
    {
        if (architecture == null)
            return new ModelToolingDto
            {
                SupportsChat = true,
                SupportsStreaming = true,
                SupportedModalities = new List<string> { "text" },
                UseCase = "Text generation and chat"
            };

        var tooling = new ModelToolingDto
        {
            SupportsChat = true,
            SupportsImages = architecture.InputModalities != null && architecture.InputModalities.Contains("image"),
            SupportsVision = architecture.InputModalities != null && architecture.InputModalities.Contains("image"),
            SupportsEmbeddings = false, // OpenRouter primarily for chat
            SupportsAudio = architecture.InputModalities != null && architecture.InputModalities.Contains("audio"),
            SupportsVideo = false,
            SupportsTools = false,
            SupportsFunctionCalling = true, // Most modern models support function calling
            SupportsStructuredOutputs = true,
            SupportsStreaming = true,
            SupportsFineTuning = false,
            SupportsBatchProcessing = false,
            SupportsModeration = false,
            SupportsRealtime = false,
            SupportsWebSearch = false,
            SupportsCodeExecution = false,
            IsOptimizedForSpeed = false,
            IsOptimizedForQuality = true,
            IsExperimental = false,
            IsDeprecated = false,
            SupportedModalities = architecture.InputModalities ?? new List<string> { "text" },
            InstructionFormat = architecture.InstructType,
            TokenizerType = architecture.Tokenizer
        };

        // Set use case based on modalities
        if (tooling.SupportsVision && tooling.SupportsAudio)
        {
            tooling.UseCase = "Multimodal AI (text, image, audio)";
        }
        else if (tooling.SupportsVision)
        {
            tooling.UseCase = "Vision-language tasks";
        }
        else if (tooling.SupportsAudio)
        {
            tooling.UseCase = "Audio processing and transcription";
        }
        else
        {
            tooling.UseCase = "Text generation and chat";
        }

        return tooling;
    }

    private static List<MessageImageDto> MapMessageImages(Message message)
    {
        var images = new List<MessageImageDto>();

        if (message.HasImages && !string.IsNullOrEmpty(message.ToolCallsJson))
        {
            try
            {
                // First try to deserialize as MessageImageDto objects (processed by service)
                var processedImages = System.Text.Json.JsonSerializer.Deserialize<List<MessageImageDto>>(message.ToolCallsJson);
                if (processedImages != null && processedImages.Any())
                {
                    return processedImages;
                }

                // Fall back to deserializing as file IDs (original behavior)
                var fileIds = System.Text.Json.JsonSerializer.Deserialize<List<int>>(message.ToolCallsJson);
                if (fileIds != null && fileIds.Any())
                {
                    // Create MessageImageDto objects with file API URLs
                    // The actual file metadata will be resolved in the service layer
                    foreach (var fileId in fileIds)
                    {
                        images.Add(new MessageImageDto
                        {
                            Id = fileId,
                            Name = $"Image {fileId}",
                            Url = $"/api/v1/files/{fileId}",
                            MimeType = "image/png" // Default, will be overridden by actual file type
                        });
                    }
                }
                else
                {
                    // Try to deserialize as StreamedImageData format (from OpenRouter streaming)
                    var streamedImages = System.Text.Json.JsonSerializer.Deserialize<List<StreamedImageData>>(message.ToolCallsJson);
                    if (streamedImages != null && streamedImages.Any())
                    {
                        foreach (var streamedImage in streamedImages)
                        {
                            images.Add(new MessageImageDto
                            {
                                Id = streamedImage.Index,
                                Name = $"Streamed Image {streamedImage.Index + 1}",
                                Url = streamedImage.Url,
                                MimeType = streamedImage.Type == "image_url" ? "image/png" : "image/png"
                            });
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                // Log error but don't fail - return empty list
                Console.WriteLine($"Error deserializing message images: {ex.Message}");
            }
        }

        return images;
    }

    private static ModelPricingDto MapOpenRouterPricing(OpenRouterModelPricingInfo pricing)
    {
        if (pricing == null)
            return new ModelPricingDto();

        var promptCost = decimal.TryParse(pricing.Prompt, out var p) ? p : 0;
        var completionCost = decimal.TryParse(pricing.Completion, out var c) ? c : 0;

        return new ModelPricingDto
        {
            PromptCostPerMillionTokens = promptCost * 1_000_000,
            CompletionCostPerMillionTokens = completionCost * 1_000_000
        };
    }

    private static string MapAnthropicDescription(AnthropicModelResponseItem src)
    {
        return src.Type switch
        {
            "claude-3-5-sonnet" => "Claude 3.5 Sonnet - Most intelligent model, best for complex reasoning",
            "claude-3-opus" => "Claude 3 Opus - Strongest model for highly complex tasks",
            "claude-3-sonnet" => "Claude 3 Sonnet - Balance of intelligence and speed",
            "claude-3-haiku" => "Claude 3 Haiku - Fastest model for simple tasks",
            _ => $"Anthropic {src.Type} model"
        };
    }

    private static ModelToolingDto MapAnthropicTooling(AnthropicModelResponseItem src)
    {
        var isClaude3 = src.Type?.Contains("claude-3") ?? false;
        var isClaude35 = src.Type?.Contains("claude-3-5") ?? false;

        var tooling = new ModelToolingDto
        {
            SupportsChat = true,
            SupportsImages = isClaude3,
            SupportsVision = isClaude3,
            SupportsEmbeddings = false,
            SupportsAudio = false,
            SupportsVideo = false,
            SupportsTools = true,
            SupportsFunctionCalling = true,
            SupportsStructuredOutputs = true,
            SupportsStreaming = true,
            SupportsFineTuning = false,
            SupportsBatchProcessing = true,
            SupportsModeration = false,
            SupportsRealtime = false,
            SupportsWebSearch = false,
            SupportsCodeExecution = false,
            IsOptimizedForSpeed = false,
            IsOptimizedForQuality = isClaude35 || src.Type?.Contains("opus") == true,
            IsExperimental = false,
            IsDeprecated = false,
            SupportedModalities = isClaude3 ? new List<string> { "text", "image" } : new List<string> { "text" },
            InstructionFormat = "Anthropic",
            TokenizerType = "Claude"
        };

        // Performance tier based on model type
        if (src.Type?.Contains("haiku") == true)
        {
            tooling.PerformanceTier = "Fast";
            tooling.UseCase = "Fast responses for simple tasks";
            tooling.IsOptimizedForSpeed = true;
        }
        else if (src.Type?.Contains("sonnet") == true)
        {
            tooling.PerformanceTier = "Balanced";
            tooling.UseCase = "Balanced performance for most tasks";
        }
        else if (src.Type?.Contains("opus") == true)
        {
            tooling.PerformanceTier = "High-Quality";
            tooling.UseCase = "Complex reasoning and analysis";
            tooling.IsOptimizedForQuality = true;
        }

        return tooling;
    }

    private static ModelPricingDto MapAnthropicPricing(AnthropicModelResponseItem src)
    {
        // Anthropic pricing based on model type (approximate values)
        return src.Type switch
        {
            "claude-3-5-sonnet" => new ModelPricingDto
                { PromptCostPerMillionTokens = 3.00m, CompletionCostPerMillionTokens = 15.00m },
            "claude-3-opus" => new ModelPricingDto
                { PromptCostPerMillionTokens = 15.00m, CompletionCostPerMillionTokens = 75.00m },
            "claude-3-sonnet" => new ModelPricingDto
                { PromptCostPerMillionTokens = 3.00m, CompletionCostPerMillionTokens = 15.00m },
            "claude-3-haiku" => new ModelPricingDto
                { PromptCostPerMillionTokens = 0.25m, CompletionCostPerMillionTokens = 1.25m },
            _ => new ModelPricingDto()
        };
    }

    private static string FormatSize(long bytes)
    {
        if (bytes == 0) return "0 B";

        var units = new[] { "B", "KB", "MB", "GB", "TB" };
        var unitIndex = 0;
        var size = (double)bytes;

        while (size >= 1024 && unitIndex < units.Length - 1)
        {
            size /= 1024;
            unitIndex++;
        }

        return $"{size:F1} {units[unitIndex]}";
    }
}