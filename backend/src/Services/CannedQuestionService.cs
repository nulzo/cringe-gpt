using System.Net;
using AutoMapper;
using OllamaWebuiBackend.Common;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Models;
using OllamaWebuiBackend.Repositories.Interfaces;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Services;

public class CannedQuestionService : ICannedQuestionService
{
    private readonly IMapper _mapper;
    private readonly ICannedQuestionRepository _repository;

    public CannedQuestionService(ICannedQuestionRepository repository, IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<IEnumerable<CannedQuestionDto>> GetAllAsync()
    {
        var questions = await _repository.GetAllOrderedAsync();
        return _mapper.Map<IEnumerable<CannedQuestionDto>>(questions);
    }

    public async Task<CannedQuestionDto?> GetByIdAsync(int id)
    {
        var question = await _repository.GetByIdAsync(id);
        return question == null ? null : _mapper.Map<CannedQuestionDto>(question);
    }

    public async Task<CannedQuestionDto> CreateAsync(CannedQuestionCreateDto createDto)
    {
        var question = _mapper.Map<CannedQuestion>(createDto);

        // If no order is specified, put it at the end
        if (question.Order == 0) question.Order = await _repository.GetMaxOrderAsync() + 1;

        await _repository.AddAsync(question);
        await _repository.SaveChangesAsync();

        return _mapper.Map<CannedQuestionDto>(question);
    }

    public async Task<CannedQuestionDto> UpdateAsync(int id, CannedQuestionUpdateDto updateDto)
    {
        var question = await _repository.GetByIdAsync(id);
        if (question == null)
            throw new ApiException("Canned question not found.", HttpStatusCode.NotFound);

        // Update only the fields that are provided
        if (!string.IsNullOrWhiteSpace(updateDto.Title))
            question.Title = updateDto.Title;

        if (!string.IsNullOrWhiteSpace(updateDto.Text))
            question.Text = updateDto.Text;

        if (updateDto.Order.HasValue)
            question.Order = updateDto.Order.Value;

        question.UpdatedAt = DateTime.UtcNow;

        _repository.Update(question);
        await _repository.SaveChangesAsync();

        return _mapper.Map<CannedQuestionDto>(question);
    }

    public async Task DeleteAsync(int id)
    {
        var question = await _repository.GetByIdAsync(id);
        if (question == null)
            throw new ApiException("Canned question not found.", HttpStatusCode.NotFound);

        _repository.Delete(question);
        await _repository.SaveChangesAsync();
    }

    public async Task<CannedQuestionDto> UpdateOrderAsync(int id, int newOrder)
    {
        var question = await _repository.GetByIdAsync(id);
        if (question == null)
            throw new ApiException("Canned question not found.", HttpStatusCode.NotFound);

        if (newOrder < 1)
            throw new ApiException("Order must be greater than 0.", HttpStatusCode.BadRequest);

        var oldOrder = question.Order;
        question.Order = newOrder;
        question.UpdatedAt = DateTime.UtcNow;

        // Get questions that need to be shifted
        var questionsToShift = await _repository.GetByOrderRangeAsync(
            Math.Min(oldOrder, newOrder),
            Math.Max(oldOrder, newOrder));

        // Shift other questions to make room
        foreach (var q in questionsToShift.Where(q => q.Id != id))
        {
            if (oldOrder < newOrder && q.Order <= newOrder)
                q.Order -= 1;
            else if (oldOrder > newOrder && q.Order >= newOrder) q.Order += 1;
            q.UpdatedAt = DateTime.UtcNow;
        }

        // Include the main question in the update
        var allQuestionsToUpdate = questionsToShift.Where(q => q.Id != id).Append(question);
        await _repository.UpdateOrdersAsync(allQuestionsToUpdate);

        return _mapper.Map<CannedQuestionDto>(question);
    }

    public async Task<IEnumerable<CannedQuestionDto>> ReorderAsync(
        IEnumerable<CannedQuestionReorderDto> reorderRequests)
    {
        var reorderList = reorderRequests.ToList();

        if (reorderList.Count == 0)
            return Array.Empty<CannedQuestionDto>();

        var questionIds = reorderList.Select(r => r.Id).ToList();
        var questions = await _repository.FindAsync(q => questionIds.Contains(q.Id));
        var questionDict = questions.ToDictionary(q => q.Id);

        var questionsToUpdate = new List<CannedQuestion>();

        foreach (var reorderRequest in reorderList)
            if (questionDict.TryGetValue(reorderRequest.Id, out var question))
            {
                if (reorderRequest.Order < 1)
                    throw new ApiException($"Order must be greater than 0 for question ID {reorderRequest.Id}.",
                        HttpStatusCode.BadRequest);

                question.Order = reorderRequest.Order;
                question.UpdatedAt = DateTime.UtcNow;
                questionsToUpdate.Add(question);
            }

        if (questionsToUpdate.Count == 0)
            throw new ApiException("No valid questions found to reorder.", HttpStatusCode.BadRequest);

        await _repository.UpdateOrdersAsync(questionsToUpdate);

        // Return the updated questions in their new order
        var updatedQuestions = await _repository.GetAllOrderedAsync();
        return _mapper.Map<IEnumerable<CannedQuestionDto>>(updatedQuestions);
    }
}
