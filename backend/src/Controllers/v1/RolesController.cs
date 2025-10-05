using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using OllamaWebuiBackend.Models;

namespace OllamaWebuiBackend.Controllers.v1;

[Authorize(Roles = "Admin")]
[Route("api/v1/roles")]
public class RolesController : BaseApiController
{
    private readonly RoleManager<IdentityRole<int>> _roleManager;
    private readonly UserManager<AppUser> _userManager;

    public RolesController(RoleManager<IdentityRole<int>> roleManager, UserManager<AppUser> userManager)
    {
        _roleManager = roleManager;
        _userManager = userManager;
    }

    [HttpPost]
    public async Task<IActionResult> CreateRole(string roleName)
    {
        if (string.IsNullOrWhiteSpace(roleName))
            return BadRequest("Role name cannot be empty.");

        var roleExists = await _roleManager.RoleExistsAsync(roleName);
        if (roleExists)
            return BadRequest("Role already exists.");

        var result = await _roleManager.CreateAsync(new IdentityRole<int>(roleName));
        if (result.Succeeded)
            return Ok($"Role '{roleName}' created successfully.");

        return BadRequest(result.Errors);
    }

    [HttpPost("assign")]
    public async Task<IActionResult> AssignRoleToUser(string email, string roleName)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null)
            return NotFound("User not found.");

        var roleExists = await _roleManager.RoleExistsAsync(roleName);
        if (!roleExists)
            return BadRequest("Role does not exist.");

        var result = await _userManager.AddToRoleAsync(user, roleName);
        if (result.Succeeded)
            return Ok($"Role '{roleName}' assigned to user '{email}' successfully.");

        return BadRequest(result.Errors);
    }
}