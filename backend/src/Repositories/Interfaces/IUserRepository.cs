using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Models;

namespace OllamaWebuiBackend.Repositories.Interfaces;

public interface IUserRepository
{
    Task<UserProfileDto?> GetProfileByIdAsync(int userId);
    Task<AppUser?> GetTrackedProfileByIdAsync(int userId);
    Task<AppUser?> GetByIdAsync(int userId);
    Task<UserSettings?> GetUserSettingsByUserIdAsync(int userId);
    Task<UserSettings?> GetUserSettingsByIdAsync(int settingsId);
    void Update(AppUser user);
    void UpdateSettings(UserSettings settings);
    Task SaveChangesAsync();
}
