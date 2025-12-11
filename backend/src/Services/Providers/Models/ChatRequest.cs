using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Enums;
using OllamaWebuiBackend.Models;

namespace OllamaWebuiBackend.Services.Providers.Models;

public class ChatRequest
{
    public required ProviderType ProviderType { get; set; }
    public required IEnumerable<Message> Messages { get; set; }
    public string? Model { get; set; }
    public bool Stream { get; set; } = false;
    public int? UserId { get; set; }
    public List<AttachmentDto>? Attachments { get; set; } // Add this for image editing


    // Optional parameters
    public double? Temperature { get; set; }
    public double? TopP { get; set; }
    public double? TopK { get; set; }
    public int? MaxTokens { get; set; }
    public string? SystemPrompt { get; set; }
}