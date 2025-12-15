using Microsoft.EntityFrameworkCore;
using OllamaWebuiBackend.Data;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Models;
using OllamaWebuiBackend.Repositories.Interfaces;

namespace OllamaWebuiBackend.Repositories;

public class UserRepository(AppDbContext context) : IUserRepository
{
    private readonly AppDbContext _context = context;

    public async Task<UserProfileDto?> GetProfileByIdAsync(int userId)
    {
        return await _context.Users
            .AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(user => new UserProfileDto
            {
                Id = user.Id,
                Email = user.Email!,
                Name = user.UserName,
                Avatar = user.Avatar,
                Provider = user.Provider,
                Settings = user.Settings != null
                    ? new UserSettingsDto
                    {
                        Theme = user.Settings.Theme,
                        PreferredModel = user.Settings.PreferredModel
                    }
                    : new UserSettingsDto { Theme = "dark", PreferredModel = null }
            })
            .FirstOrDefaultAsync();
    }

    public async Task<AppUser?> GetTrackedProfileByIdAsync(int userId)
    {
        return await _context.Users
            .Include(u => u.Settings)
            .FirstOrDefaultAsync(u => u.Id == userId);
    }

    public async Task<AppUser?> GetByIdAsync(int userId)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId);
    }

    public async Task<UserSettings?> GetUserSettingsByUserIdAsync(int userId)
    {
        return await _context.Set<UserSettings>()
            .FirstOrDefaultAsync(s => s.UserId == userId);
    }

    public async Task<UserSettings?> GetUserSettingsByIdAsync(int settingsId)
    {
        return await _context.Set<UserSettings>()
            .FirstOrDefaultAsync(s => s.Id == settingsId);
    }

    public void Update(AppUser user)
    {
        _context.Users.Update(user);
    }

    public void UpdateSettings(UserSettings settings)
    {
        _context.Set<UserSettings>().Update(settings);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
