using AutoMapper;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Models;
using OllamaWebuiBackend.Repositories.Interfaces;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Services;

public class MessageService : IMessageService
{
    private readonly IMessageRepository _messageRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<MessageService> _logger;
    private readonly IFileService _fileService;

    public MessageService(
        IMessageRepository messageRepository,
        IMapper mapper,
        ILogger<MessageService> logger,
        IFileService fileService)
    {
        _messageRepository = messageRepository;
        _mapper = mapper;
        _logger = logger;
        _fileService = fileService;
    }

    public async Task<MessageDto> UpdateLikeStatusAsync(Guid messageId, int userId, bool isLiked)
    {
        _logger.LogInformation("Updating like status for message {MessageId} to {IsLiked} for user {UserId}",
            messageId, isLiked, userId);

        await _messageRepository.UpdateLikeStatusAsync(messageId, userId, isLiked);

        var updatedMessage = await _messageRepository.GetByMessageIdAsync(messageId, userId);
        if (updatedMessage == null)
        {
            throw new KeyNotFoundException($"Message {messageId} not found for user {userId}");
        }

        var result = _mapper.Map<MessageDto>(updatedMessage);
        _logger.LogInformation("Successfully updated like status for message {MessageId}", messageId);

        return result;
    }

    public async Task<MessageDetailsDto> GetMessageDetailsAsync(Guid messageId, int userId)
    {
        _logger.LogInformation("Getting message details for message {MessageId} for user {UserId}",
            messageId, userId);

        var details = await _messageRepository.GetMessageDetailsAsync(messageId, userId);
        if (details == null)
        {
            _logger.LogWarning("Message {MessageId} not found for user {UserId}", messageId, userId);
            throw new KeyNotFoundException($"Message {messageId} not found");
        }

        // Enrich images with actual file metadata if needed
        if (details.Images != null && details.Images.Any())
        {
            await EnrichImagesWithFileMetadata(details.Images, userId);
        }

        return details;
    }

    public async Task<MessageStatsDto> GetMessageStatsAsync(int userId)
    {
        _logger.LogInformation("Getting message statistics for user {UserId}", userId);

        var stats = await _messageRepository.GetMessageStatsAsync(userId);
        _logger.LogInformation("Retrieved message stats for user {UserId}: {TotalMessages} total messages",
            userId, stats.TotalMessages);

        return stats;
    }

    public async Task<IEnumerable<MessageDto>> GetLikedMessagesAsync(int userId, int? page = null, int? pageSize = null)
    {
        _logger.LogInformation("Getting liked messages for user {UserId}", userId);

        var likedMessages = await _messageRepository.GetLikedMessagesAsync(userId, page, pageSize);
        var result = _mapper.Map<IEnumerable<MessageDto>>(likedMessages);

        // Enrich images with actual file metadata for all messages
        foreach (var messageDto in result)
        {
            if (messageDto.Images != null && messageDto.Images.Any())
            {
                await EnrichImagesWithFileMetadata(messageDto.Images, userId);
            }
        }

        _logger.LogInformation("Retrieved {Count} liked messages for user {UserId}",
            result.Count(), userId);

        return result;
    }

    private async Task EnrichImagesWithFileMetadata(List<MessageImageDto> images, int userId)
    {
        foreach (var image in images)
        {
            try
            {
                // If we have a file ID, get the actual file metadata
                if (image.Id > 0)
                {
                    var file = await _fileService.GetFileAsync(image.Id, userId);
                    if (file != null)
                    {
                        // Update image metadata with actual file information
                        image.Name = file.Name;
                        image.MimeType = file.MimeType;
                        image.Url = $"/api/v1/files/{file.Id}";
                    }
                    else
                    {
                        _logger.LogWarning("File {FileId} not found for user {UserId}", image.Id, userId);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error enriching image {ImageId} with file metadata", image.Id);
                // Continue processing other images
            }
        }
    }
}
