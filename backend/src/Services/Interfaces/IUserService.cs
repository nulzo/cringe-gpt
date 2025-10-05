using OllamaWebuiBackend.DTOs;

namespace OllamaWebuiBackend.Services.Interfaces;

public interface IUserService
{
    Task<UserProfileDto> GetProfileAsync(int userId);
    Task<UserDto> UpdateProfileAsync(int userId, UserUpdateDto updateDto);
    Task DeleteUserAsync(int userId);
    Task<bool> IsInRoleAsync(int userId, string role);
    Task<UserSettingsDto> GetUserSettingsAsync(int userId);
    Task<UserSettingsDto> UpdateUserSettingsAsync(int userId, UserSettingsDto settingsDto);
}