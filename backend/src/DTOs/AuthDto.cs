namespace OllamaWebuiBackend.DTOs;

public class RegisterDto
{
    public required string Username { get; set; }
    public required string Email { get; set; }
    public required string Password { get; set; }
}

public class LoginDto
{
    public required string UsernameOrEmail { get; set; }
    public required string Password { get; set; }
}

public class AuthResponseDto
{
    public required int Id { get; set; }
    public required string Username { get; set; }
    public required string Email { get; set; }
    public string? Avatar { get; set; }
    public required string Token { get; set; }
}
