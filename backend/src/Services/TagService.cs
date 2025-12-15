using AutoMapper;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Repositories.Interfaces;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Services;

public class TagService : ITagService
{
    private readonly IMapper _mapper;
    private readonly ITagRepository _tagRepository;

    public TagService(ITagRepository tagRepository, IMapper mapper)
    {
        _tagRepository = tagRepository;
        _mapper = mapper;
    }

    public async Task<IEnumerable<TagDto>> GetAllAsync()
    {
        var tags = await _tagRepository.GetAllAsync();
        return _mapper.Map<IEnumerable<TagDto>>(tags)
            .OrderBy(t => t.Name);
    }
}
