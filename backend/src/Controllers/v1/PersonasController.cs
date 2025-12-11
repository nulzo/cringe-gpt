using Microsoft.AspNetCore.Mvc;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Controllers.v1;

[ApiController]
[Route("api/v1/personas")]
public class PersonasController : BaseApiController
{
    private readonly IPersonaService _personaService;

    public PersonasController(IPersonaService personaService)
    {
        _personaService = personaService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var personas = await _personaService.GetAllAsync(GetUserId());
        return Ok(personas);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var persona = await _personaService.GetByIdAsync(id, GetUserId());
        return persona == null ? NotFound() : Ok(persona);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PersonaCreateDto createDto)
    {
        var created = await _personaService.CreateAsync(GetUserId(), createDto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] PersonaUpdateDto updateDto)
    {
        var updated = await _personaService.UpdateAsync(id, GetUserId(), updateDto);
        return updated == null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await _personaService.DeleteAsync(id, GetUserId());
        return success ? NoContent() : NotFound();
    }
}

