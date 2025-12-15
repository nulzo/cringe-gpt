using System.ComponentModel.DataAnnotations;
using OllamaWebuiBackend.Enums;

namespace OllamaWebuiBackend.DTOs;

public class ChatRequestDto
{
    public int? ConversationId { get; set; }
    [Required]
    public required string Message { get; set; }
    public string? Model { get; set; }
    public ProviderType? Provider { get; set; }
    public bool Stream { get; set; } = true;
    public bool IsTemporary { get; set; } = false;
    public double? Temperature { get; set; }
    public double? TopP { get; set; }
    public double? TopK { get; set; }
    public int? MaxTokens { get; set; }
    public string? SystemPrompt { get; set; }
    public List<AttachmentDto>? Attachments { get; set; }
    public int? UserId { get; set; }
    public int? PersonaId { get; set; }
    public int? PromptId { get; set; }
    public Dictionary<string, string>? PromptVariables { get; set; }
}

public class AttachmentDto
{
    [Required]
    public required string FileName { get; set; }
    [Required]
    public required string ContentType { get; set; }
    [Required]
    public required string Base64Data { get; set; }
}

public class OllamaChatConfiguration
{
    public double? Temperature { get; set; }
    public double? TopP { get; set; }
    public int? MaxTokens { get; set; }
    public int? NumKeep { get; set; }
    public int? NumPredict { get; set; }
    public int? Seed { get; set; }
    public int? TopK { get; set; }
    public double? MinP { get; set; }
    public double? TypicalP { get; set; }
    public int? RepeatLastN { get; set; }
    public double? RepeatPenalty { get; set; }
    public double? FrequencyPenalty { get; set; }
    public double? PenalizeNewline { get; set; }
    public List<string> Stop { get; set; }
    public int NumCtx { get; set; }
    public int MainGpu { get; set; }
    public bool UseMmap { get; set; }
    public int NumThread { get; set; }
}
