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

    public async Task<IEnumerable<PromptDto>> GetAllAsync()
    {
        var prompts = await _promptRepository.GetAllWithTagsAsync();
        return _mapper.Map<IEnumerable<PromptDto>>(prompts);
    }

    public async Task<IEnumerable<PromptDto>> GetByTagAsync(string tagName)
    {
        var prompts = await _promptRepository.GetByTagNameAsync(tagName);
        return _mapper.Map<IEnumerable<PromptDto>>(prompts);
    }

    public async Task<PromptDto?> GetByIdAsync(int id)
    {
        var prompt = await _promptRepository.GetByIdAsNoTrackingWithTagsAsync(id);
        return _mapper.Map<PromptDto>(prompt);
    }

    public async Task<PromptDto> CreateAsync(PromptCreateDto createDto)
    {
        var tags = await _tagRepository.GetOrCreateTagsAsync(createDto.Tags);

        var prompt = new Prompt
        {
            Title = createDto.Title,
            Content = createDto.Content,
            Tags = tags
        };

        await _promptRepository.AddAsync(prompt);
        await _promptRepository.SaveChangesAsync();

        return _mapper.Map<PromptDto>(prompt);
    }

    public async Task<PromptDto?> UpdateAsync(int id, PromptUpdateDto updateDto)
    {
        var prompt = await _promptRepository.GetByIdWithTagsAsync(id);

        if (prompt == null) return null;

        if (updateDto.Title != null)
            prompt.Title = updateDto.Title;

        if (updateDto.Content != null)
            prompt.Content = updateDto.Content;

        if (updateDto.Tags != null)
            prompt.Tags = await _tagRepository.GetOrCreateTagsAsync(updateDto.Tags);

        await _promptRepository.SaveChangesAsync();

        return _mapper.Map<PromptDto>(prompt);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var prompt = await _promptRepository.GetByIdAsync(id);
        if (prompt == null) return false;

        _promptRepository.Delete(prompt);
        await _promptRepository.SaveChangesAsync();
        return true;
    }
}