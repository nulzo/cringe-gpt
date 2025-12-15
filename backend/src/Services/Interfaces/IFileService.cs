using OllamaWebuiBackend.Models;

namespace OllamaWebuiBackend.Services.Interfaces;

public interface IFileService
{
    Task<AppFile> SaveFileAsync(int userId, byte[] content, string fileName, string mimeType);
    Task<AppFile?> GetFileAsync(int id, int userId);
    Task<byte[]?> GetFileContentAsync(AppFile file);
}
