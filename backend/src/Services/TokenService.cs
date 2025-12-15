using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using OllamaWebuiBackend.Models;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Services;

public class TokenService : ITokenService
{
    private readonly string _issuer;
    private readonly SymmetricSecurityKey _key;
    private readonly UserManager<AppUser> _userManager;

    public TokenService(IConfiguration config, UserManager<AppUser> userManager)
    {
        var keyString = config["Jwt:Key"] ??
                        throw new ArgumentNullException(nameof(config), "JWT Key is not configured.");
        if (keyString.Length < 32) throw new ArgumentException("JWT Key must be at least 32 characters long.");
        _key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyString));
        _issuer = config["Jwt:Issuer"] ??
                  throw new ArgumentNullException(nameof(config), "JWT Issuer is not configured.");
        _userManager = userManager;
    }

    public string CreateToken(AppUser user)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.UserName!),
            new(ClaimTypes.Email, user.Email!)
        };

        var roles = _userManager.GetRolesAsync(user).Result;
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var creds = new SigningCredentials(_key, SecurityAlgorithms.HmacSha512Signature);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddDays(7),
            SigningCredentials = creds,
            Issuer = _issuer
        };

        var tokenHandler = new JwtSecurityTokenHandler();

        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
    }
}
