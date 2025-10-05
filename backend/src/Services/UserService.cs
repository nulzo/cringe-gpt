using System.Net;
using Microsoft.AspNetCore.Identity;
using OllamaWebuiBackend.Common;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Models;
using OllamaWebuiBackend.Repositories.Interfaces;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Services;

public class UserService(UserManager<AppUser> userManager, IUserRepository userRepository) : IUserService
{
    private readonly UserManager<AppUser> _userManager = userManager;
    private readonly IUserRepository _userRepository = userRepository;

    public async Task<UserProfileDto> GetProfileAsync(int userId)
    {
        var user = await _userRepository.GetProfileByIdAsync(userId);

        if (user == null) throw new ApiException("User not found.", HttpStatusCode.NotFound);

        return user;
    }

    public async Task<UserDto> UpdateProfileAsync(int userId, UserUpdateDto updateDto)
    {
        var user = await _userRepository.GetTrackedProfileByIdAsync(userId);

        if (user == null) throw new ApiException("User not found.", HttpStatusCode.NotFound);

        if (updateDto.Settings != null)
        {
            var settings = await _userRepository.GetUserSettingsByUserIdAsync(userId);
            
            if (settings == null)
            {
                settings = new UserSettings
                {
                    UserId = userId,
                    Theme = updateDto.Settings.Theme ?? "dark",
                    PreferredModel = updateDto.Settings.PreferredModel
                };
                user.Settings = settings;
                _userRepository.Update(user);
            }
            else
            {
                settings.Theme = updateDto.Settings.Theme ?? settings.Theme;
                settings.PreferredModel = updateDto.Settings.PreferredModel;
                _userRepository.UpdateSettings(settings);
            }
            
            await _userRepository.SaveChangesAsync();
        }

        var userDto = await _userRepository.GetProfileByIdAsync(userId);
        if (userDto == null) throw new ApiException("Failed to retrieve updated user profile.", HttpStatusCode.InternalServerError);

        return new UserDto
        {
            Id = userDto.Id,
            Email = userDto.Email,
            Provider = userDto.Provider,
            Avatar = userDto.Avatar,
            Name = userDto.Name,
            Settings = userDto.Settings
        };
    }

    public async Task DeleteUserAsync(int userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);

        if (user == null) throw new ApiException("User not found.", HttpStatusCode.NotFound);

        user.IsDeleted = true;
        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();
    }

    public async Task<bool> IsInRoleAsync(int userId, string role)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            return false;

        return await _userManager.IsInRoleAsync(user, role);
    }
    
    public async Task<UserSettingsDto> GetUserSettingsAsync(int userId)
    {
        var settings = await _userRepository.GetUserSettingsByUserIdAsync(userId);
        
        if (settings == null)
        {
            return new UserSettingsDto
            {
                Theme = "dark",
                PreferredModel = null
            };
        }
        
        return new UserSettingsDto
        {
            Theme = settings.Theme,
            PreferredModel = settings.PreferredModel
        };
    }
    
    public async Task<UserSettingsDto> UpdateUserSettingsAsync(int userId, UserSettingsDto settingsDto)
    {
        var settings = await _userRepository.GetUserSettingsByUserIdAsync(userId);
        
        if (settings == null)
        {
            var user = await _userRepository.GetTrackedProfileByIdAsync(userId);
            if (user == null) throw new ApiException("User not found.", HttpStatusCode.NotFound);
            
            settings = new UserSettings
            {
                UserId = userId,
                Theme = settingsDto.Theme ?? "dark",
                PreferredModel = settingsDto.PreferredModel
            };
            
            user.Settings = settings;
            _userRepository.Update(user);
        }
        else
        {
            settings.Theme = settingsDto.Theme ?? settings.Theme;
            settings.PreferredModel = settingsDto.PreferredModel;
            _userRepository.UpdateSettings(settings);
        }
        
        await _userRepository.SaveChangesAsync();
        
        return new UserSettingsDto
        {
            Theme = settings.Theme,
            PreferredModel = settings.PreferredModel
        };
    }
}