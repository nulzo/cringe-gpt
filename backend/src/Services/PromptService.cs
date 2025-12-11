using AutoMapper;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Models;
using OllamaWebuiBackend.Repositories.Interfaces;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Services;

public class PromptService : IPromptService
{
    private readonly IMapper _mapper;
    private readonly IPromptRepository _promptRepository;
    private readonly ITagRepository _tagRepository;

    public PromptService(IPromptRepository promptRepository, ITagRepository tagRepository, IMapper mapper)
    {
        _promptRepository = promptRepository;
        _tagRepository = tagRepository;
        _mapper = mapper;
    }

    public async Task<IEnumerable<PromptDto>> GetAllAsync(int userId)
    {
        var prompts = await _promptRepository.GetAllForUserAsync(userId);
        return prompts.Select(MapPromptDto);
    }

    public async Task<IEnumerable<PromptDto>> GetByTagAsync(string tagName, int userId)
    {
        var prompts = await _promptRepository.GetByTagNameForUserAsync(tagName, userId);
        return prompts.Select(MapPromptDto);
    }

    public async Task<PromptDto?> GetByIdAsync(int id, int userId)
    {
        var prompt = await _promptRepository.GetByIdForUserAsync(id, userId);
        return prompt == null ? null : MapPromptDto(prompt);
    }

    public async Task<PromptDto> CreateAsync(int userId, PromptCreateDto createDto)
    {
        var tags = await _tagRepository.GetOrCreateTagsAsync(createDto.Tags);

        var prompt = new Prompt
        {
            UserId = userId,
            Title = createDto.Title,
            Content = createDto.Content,
            VariablesJson = SerializeVariables(createDto.Variables),
            Tags = tags
        };

        await _promptRepository.AddAsync(prompt);
        await _promptRepository.SaveChangesAsync();

        return MapPromptDto(prompt);
    }

    public async Task<PromptDto?> UpdateAsync(int id, int userId, PromptUpdateDto updateDto)
    {
        var prompt = await _promptRepository.GetByIdForUserAsync(id, userId);

        if (prompt == null) return null;

        if (updateDto.Title != null)
            prompt.Title = updateDto.Title;

        if (updateDto.Content != null)
            prompt.Content = updateDto.Content;

        if (updateDto.Tags != null)
            prompt.Tags = await _tagRepository.GetOrCreateTagsAsync(updateDto.Tags);

        if (updateDto.Variables != null)
            prompt.VariablesJson = SerializeVariables(updateDto.Variables);

        await _promptRepository.SaveChangesAsync();

        return MapPromptDto(prompt);
    }

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        var prompt = await _promptRepository.GetByIdForUserAsync(id, userId);
        if (prompt == null) return false;

        _promptRepository.Delete(prompt);
        await _promptRepository.SaveChangesAsync();
        return true;
    }

    private PromptDto MapPromptDto(Prompt prompt)
    {
        return new PromptDto
        {
            Id = prompt.Id,
            UserId = prompt.UserId,
            Title = prompt.Title,
            Content = prompt.Content,
            Tags = _mapper.Map<List<TagDto>>(prompt.Tags),
            Variables = DeserializeVariables(prompt.VariablesJson)
        };
    }

    private static string? SerializeVariables(IEnumerable<PromptVariableDto>? variables)
    {
        if (variables == null) return null;
        var list = variables.ToList();
        if (list.Count == 0) return null;
        return System.Text.Json.JsonSerializer.Serialize(list);
    }

    private static List<PromptVariableDto> DeserializeVariables(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new List<PromptVariableDto>();
        try
        {
            var parsed = System.Text.Json.JsonSerializer.Deserialize<List<PromptVariableDto>>(json);
            return parsed ?? new List<PromptVariableDto>();
        }
        catch
        {
            return new List<PromptVariableDto>();
        }
    }
}