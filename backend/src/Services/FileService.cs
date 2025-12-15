using Microsoft.EntityFrameworkCore;
using OllamaWebuiBackend.Data;
using OllamaWebuiBackend.Models;
using OllamaWebuiBackend.Repositories.Interfaces;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Services;

public class FileService : IFileService
{
    private readonly IGenericRepository<AppFile> _fileRepository;
    private readonly string _storagePath;

    public FileService(IGenericRepository<AppFile> fileRepository)
    {
        _fileRepository = fileRepository;
        _storagePath = Path.Combine(AppContext.BaseDirectory, "Storage");

        if (!Directory.Exists(_storagePath))
        {
            Directory.CreateDirectory(_storagePath);
        }
    }

    public async Task<AppFile> SaveFileAsync(int userId, byte[] content, string fileName, string mimeType)
    {
        var fileId = Guid.NewGuid();
        var fileExtension = Path.GetExtension(fileName);
        var newFileName = $"{fileId}{fileExtension}";

        var absoluteFilePath = Path.Combine(_storagePath, newFileName);
        await File.WriteAllBytesAsync(absoluteFilePath, content);

        var relativeFilePath = Path.Combine("Storage", newFileName);
        var appFile = new AppFile
        {
            UserId = userId,
            Name = fileName,
            FilePath = relativeFilePath,
            Size = content.Length,
            MimeType = mimeType
        };

        await _fileRepository.AddAsync(appFile);
        await _fileRepository.SaveChangesAsync();

        return appFile;
    }

    public async Task<AppFile?> GetFileAsync(int id, int userId)
    {
        var result = await _fileRepository.FindAsync(f => f.Id == id && f.UserId == userId);
        return result.FirstOrDefault();
    }

    public async Task<byte[]?> GetFileContentAsync(AppFile file)
    {
        var filePath = Path.Combine(AppContext.BaseDirectory, file.FilePath);
        if (File.Exists(filePath))
        {
            return await File.ReadAllBytesAsync(filePath);
        }
        return null;
    }
}
