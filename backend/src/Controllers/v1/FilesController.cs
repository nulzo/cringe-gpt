using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OllamaWebuiBackend.Models;
using OllamaWebuiBackend.Repositories.Interfaces;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Controllers.v1;

#if !DEBUG
[Authorize]
#endif
[ApiController]
[Route("api/v1/files")]
public class FilesController : BaseApiController
{
    private readonly IFileService _fileService;
    private readonly IGenericRepository<AppFile> _fileRepository;

    public FilesController(IFileService fileService, IGenericRepository<AppFile> fileRepository)
    {
        _fileService = fileService;
        _fileRepository = fileRepository;
    }

    [HttpPost("upload")]
    public IActionResult Upload()
    {
        return StatusCode(StatusCodes.Status501NotImplemented, "File upload not implemented.");
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? page = 1, [FromQuery] int? pageSize = 20)
    {
        try
        {
            var userId = GetUserId();

            // Get files for the current user with pagination
            var files = await _fileRepository.FindAsync(f => f.UserId == userId);
            var userFiles = files.ToList();

            // Apply pagination
            var totalCount = userFiles.Count;
            var skip = (page - 1) * pageSize ?? 0;
            var take = pageSize ?? 20;

            var paginatedFiles = userFiles
                .OrderByDescending(f => f.CreatedAt)
                .Skip(skip)
                .Take(take)
                .Select(file => new
                {
                    Id = file.Id,
                    Name = file.Name,
                    FilePath = file.FilePath,
                    Size = file.Size,
                    MimeType = file.MimeType,
                    CreatedAt = file.CreatedAt,
                    UpdatedAt = file.UpdatedAt,
                    Url = $"/api/v1/files/{file.Id}",
                    IsImage = file.MimeType?.StartsWith("image/") ?? false
                })
                .ToList();

            var response = new
            {
                Data = paginatedFiles,
                Pagination = new
                {
                    Page = page,
                    PageSize = pageSize,
                    TotalCount = totalCount,
                    TotalPages = (int)Math.Ceiling((double)totalCount / (pageSize ?? 20)),
                    HasNextPage = skip + take < totalCount,
                    HasPreviousPage = page > 1
                }
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { error = "Failed to retrieve files", details = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id, [FromQuery] bool? base64 = false)
    {
        var file = await _fileService.GetFileAsync(id, GetUserId());

        if (file == null)
            return NotFound();

        var content = await _fileService.GetFileContentAsync(file);

        if (content == null)
            return NotFound("File not found on disk.");

        // If base64 is requested, return JSON with base64 content
        if (base64 == true)
        {
            var base64String = Convert.ToBase64String(content);
            var response = new
            {
                Id = file.Id,
                Name = file.Name,
                MimeType = file.MimeType,
                Size = file.Size,
                Base64Data = base64String,
                DataUrl = $"data:{file.MimeType};base64,{base64String}"
            };

            return Ok(response);
        }

        // Otherwise return the binary file (for backward compatibility)
        return File(content, file.MimeType, file.Name);
    }

    [HttpGet("{id}/metadata")]
    public async Task<IActionResult> GetMetadata(int id)
    {
        var file = await _fileService.GetFileAsync(id, GetUserId());

        if (file == null)
            return NotFound();

        var metadata = new
        {
            Id = file.Id,
            Filename = file.Name,
            ContentType = file.MimeType,
            Size = file.Size,
            Dimensions = file.MimeType?.StartsWith("image/") == true ? GetImageDimensions(file) : null,
            CreatedAt = file.CreatedAt,
            UpdatedAt = file.UpdatedAt
        };

        return Ok(metadata);
    }

    [HttpGet("images")]
    public async Task<IActionResult> GetImages([FromQuery] int? page = 1, [FromQuery] int? pageSize = 20)
    {
        try
        {
            var userId = GetUserId();

            // Get only image files for the current user
            var files = await _fileRepository.FindAsync(f => f.UserId == userId && f.MimeType.StartsWith("image/"));
            var imageFiles = files.ToList();

            // Apply pagination
            var totalCount = imageFiles.Count;
            var skip = (page - 1) * pageSize ?? 0;
            var take = pageSize ?? 20;

            var paginatedImages = imageFiles
                .OrderByDescending(f => f.CreatedAt)
                .Skip(skip)
                .Take(take)
                .Select(file => new
                {
                    Id = file.Id,
                    Name = file.Name,
                    FilePath = file.FilePath,
                    Size = file.Size,
                    MimeType = file.MimeType,
                    CreatedAt = file.CreatedAt,
                    UpdatedAt = file.UpdatedAt,
                    Url = $"/api/v1/files/{file.Id}",
                    ThumbnailUrl = $"/api/v1/files/{file.Id}?thumbnail=true" // You can implement thumbnail generation later
                })
                .ToList();

            var response = new
            {
                Data = paginatedImages,
                Pagination = new
                {
                    Page = page,
                    PageSize = pageSize,
                    TotalCount = totalCount,
                    TotalPages = (int)Math.Ceiling((double)totalCount / (pageSize ?? 20)),
                    HasNextPage = skip + take < totalCount,
                    HasPreviousPage = page > 1
                }
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { error = "Failed to retrieve images", details = ex.Message });
        }
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string? query, [FromQuery] string? mimeType, [FromQuery] int? page = 1, [FromQuery] int? pageSize = 20)
    {
        try
        {
            var userId = GetUserId();

            // Build search query
            var files = await _fileRepository.FindAsync(f => f.UserId == userId);
            var userFiles = files.ToList();

            // Apply filters
            var filteredFiles = userFiles.AsQueryable();

            if (!string.IsNullOrWhiteSpace(query))
            {
                filteredFiles = filteredFiles.Where(f => f.Name.Contains(query, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(mimeType))
            {
                filteredFiles = filteredFiles.Where(f => f.MimeType.StartsWith(mimeType));
            }

            var filteredList = filteredFiles.ToList();

            // Apply pagination
            var totalCount = filteredList.Count;
            var skip = (page - 1) * pageSize ?? 0;
            var take = pageSize ?? 20;

            var paginatedFiles = filteredList
                .OrderByDescending(f => f.CreatedAt)
                .Skip(skip)
                .Take(take)
                .Select(file => new
                {
                    Id = file.Id,
                    Name = file.Name,
                    FilePath = file.FilePath,
                    Size = file.Size,
                    MimeType = file.MimeType,
                    CreatedAt = file.CreatedAt,
                    UpdatedAt = file.UpdatedAt,
                    Url = $"/api/v1/files/{file.Id}",
                    IsImage = file.MimeType?.StartsWith("image/") ?? false
                })
                .ToList();

            var response = new
            {
                Data = paginatedFiles,
                Pagination = new
                {
                    Page = page,
                    PageSize = pageSize,
                    TotalCount = totalCount,
                    TotalPages = (int)Math.Ceiling((double)totalCount / (pageSize ?? 20)),
                    HasNextPage = skip + take < totalCount,
                    HasPreviousPage = page > 1
                },
                Search = new
                {
                    Query = query,
                    MimeType = mimeType
                }
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { error = "Failed to search files", details = ex.Message });
        }
    }

    private object? GetImageDimensions(object file)
    {
        // This is a placeholder - you might want to implement actual image dimension detection
        // For now, return null to indicate dimensions are not available
        // In a real implementation, you could use a library like ImageSharp to get actual dimensions
        return null;
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        return StatusCode(StatusCodes.Status501NotImplemented, $"File delete {id} not implemented.");
    }
}
