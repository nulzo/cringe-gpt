using Microsoft.AspNetCore.Mvc;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Controllers.v1;

[ApiController]
[Route("api/v1/canned-questions")]
public class CannedQuestionsController : BaseApiController
{
    private readonly ICannedQuestionService _service;

    public CannedQuestionsController(ICannedQuestionService service)
    {
        _service = service;
    }

    /// <summary>
    ///     Get all canned questions ordered by their order property
    /// </summary>
    /// <returns>List of canned questions</returns>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var questions = await _service.GetAllAsync();
        return Ok(questions);
    }

    /// <summary>
    ///     Get a specific canned question by ID
    /// </summary>
    /// <param name="id">The ID of the canned question</param>
    /// <returns>The canned question if found</returns>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var question = await _service.GetByIdAsync(id);
        if (question == null)
            return NotFound();

        return Ok(question);
    }

    /// <summary>
    ///     Create a new canned question
    /// </summary>
    /// <param name="createDto">The canned question data</param>
    /// <returns>The created canned question</returns>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CannedQuestionCreateDto createDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var question = await _service.CreateAsync(createDto);
        return CreatedAtAction(nameof(GetById), new { id = question.Id }, question);
    }

    /// <summary>
    ///     Update an existing canned question
    /// </summary>
    /// <param name="id">The ID of the canned question to update</param>
    /// <param name="updateDto">The updated canned question data</param>
    /// <returns>The updated canned question</returns>
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] CannedQuestionUpdateDto updateDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var question = await _service.UpdateAsync(id, updateDto);
        return Ok(question);
    }

    /// <summary>
    ///     Partially update an existing canned question
    /// </summary>
    /// <param name="id">The ID of the canned question to update</param>
    /// <param name="updateDto">The partial canned question data</param>
    /// <returns>The updated canned question</returns>
    [HttpPatch("{id}")]
    public async Task<IActionResult> PartialUpdate(int id, [FromBody] CannedQuestionUpdateDto updateDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var question = await _service.UpdateAsync(id, updateDto);
        return Ok(question);
    }

    /// <summary>
    ///     Delete a canned question
    /// </summary>
    /// <param name="id">The ID of the canned question to delete</param>
    /// <returns>No content on success</returns>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.DeleteAsync(id);
        return NoContent();
    }

    /// <summary>
    ///     Update the order of a specific canned question
    /// </summary>
    /// <param name="id">The ID of the canned question</param>
    /// <param name="newOrder">The new order value</param>
    /// <returns>The updated canned question</returns>
    [HttpPut("{id}/order")]
    public async Task<IActionResult> UpdateOrder(int id, [FromBody] int newOrder)
    {
        var question = await _service.UpdateOrderAsync(id, newOrder);
        return Ok(question);
    }

    /// <summary>
    ///     Reorder multiple canned questions at once
    /// </summary>
    /// <param name="reorderRequests">List of ID and order pairs</param>
    /// <returns>List of all canned questions in their new order</returns>
    [HttpPost("reorder")]
    public async Task<IActionResult> Reorder([FromBody] IEnumerable<CannedQuestionReorderDto> reorderRequests)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var questions = await _service.ReorderAsync(reorderRequests);
        return Ok(questions);
    }
}
