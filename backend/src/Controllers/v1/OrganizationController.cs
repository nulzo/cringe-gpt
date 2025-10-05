using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Controllers.v1;

[Authorize]
[ApiController]
[Route("api/v1/organizations")]
public class OrganizationController : BaseApiController
{
    private readonly IOrganizationService _organizationService;

    public OrganizationController(IOrganizationService organizationService)
    {
        _organizationService = organizationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetForUser()
    {
        var orgs = await _organizationService.GetForUserAsync(GetUserId());
        return Ok(orgs);
    }

    [HttpGet("{orgId}")]
    public async Task<IActionResult> GetById(int orgId)
    {
        var org = await _organizationService.GetByIdAsync(orgId, GetUserId());
        if (org == null) return NotFound();

        return Ok(org);
    }

    [HttpPost]
    public async Task<IActionResult> Create(OrganizationCreateDto createDto)
    {
        var org = await _organizationService.CreateAsync(GetUserId(), createDto);
        return CreatedAtAction(nameof(GetById), new { orgId = org.Id }, org);
    }
}