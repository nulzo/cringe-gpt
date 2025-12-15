namespace OllamaWebuiBackend.DTOs;

public class UserSettingsDto
{
    public string? Theme { get; set; }
    public string? PreferredModel { get; set; }
}

public class UserDto
{
    public int Id { get; set; }
    public required string Email { get; set; }
    public string? Avatar { get; set; }
    public string? Provider { get; set; }
    public string? Name { get; set; }
    public UserSettingsDto Settings { get; set; } = new();
}

public class UserProfileDto
{
    public int Id { get; set; }
    public required string Email { get; set; }
    public string? Name { get; set; }
    public string? Avatar { get; set; }
    public string Provider { get; set; } = "local";
    public UserSettingsDto Settings { get; set; } = new();
}

public class UserUpdateDto
{
    public UserSettingsDto? Settings { get; set; }
    public string? Name { get; set; }
    public string? AvatarDataUrl { get; set; }
    public bool? RemoveAvatar { get; set; }
}
