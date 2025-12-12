using System.Text.Json;
using AutoMapper;
using OllamaWebuiBackend.DTOs;
using OllamaWebuiBackend.Enums;
using OllamaWebuiBackend.Models;
using OllamaWebuiBackend.Repositories.Interfaces;
using OllamaWebuiBackend.Services.Interfaces;

namespace OllamaWebuiBackend.Services;

public class PersonaService : IPersonaService
{
    private readonly IAgentRepository _agentRepository;
    private readonly IMapper _mapper;

    public PersonaService(IAgentRepository agentRepository, IMapper mapper)
    {
        _agentRepository = agentRepository;
        _mapper = mapper;
    }

    public async Task<IEnumerable<PersonaDto>> GetAllAsync(int userId)
    {
        var agents = await _agentRepository.GetAllForUserAsync(userId);
        return agents.Select(MapPersonaDto);
    }

    public async Task<PersonaDto?> GetByIdAsync(int id, int userId)
    {
        var agent = await _agentRepository.GetByIdForUserAsync(id, userId);
        return agent == null ? null : MapPersonaDto(agent);
    }

    public async Task<PersonaDto> CreateAsync(int userId, PersonaCreateDto createDto)
    {
        var agent = new Agent
        {
            AuthorId = userId,
            Name = createDto.Name,
            Description = createDto.Description,
            Instructions = createDto.Instructions,
            Avatar = createDto.Avatar,
            Provider = createDto.Provider.ToString(),
            Model = createDto.Model,
            ModelParametersJson = SerializeParameters(createDto.Parameters)
        };

        await _agentRepository.AddAsync(agent);
        await _agentRepository.SaveChangesAsync();

        return MapPersonaDto(agent);
    }

    public async Task<PersonaDto?> UpdateAsync(int id, int userId, PersonaUpdateDto updateDto)
    {
        var agent = await _agentRepository.GetByIdForUserAsync(id, userId);
        if (agent == null) return null;

        if (updateDto.Name != null) agent.Name = updateDto.Name;
        if (updateDto.Description != null) agent.Description = updateDto.Description;
        if (updateDto.Instructions != null) agent.Instructions = updateDto.Instructions;
        if (updateDto.Avatar != null) agent.Avatar = updateDto.Avatar;
        if (updateDto.Provider.HasValue) agent.Provider = updateDto.Provider.Value.ToString();
        if (updateDto.Model != null) agent.Model = updateDto.Model;
        if (updateDto.Parameters != null) agent.ModelParametersJson = SerializeParameters(updateDto.Parameters);

        await _agentRepository.SaveChangesAsync();
        return MapPersonaDto(agent);
    }

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        var agent = await _agentRepository.GetByIdForUserAsync(id, userId);
        if (agent == null) return false;

        _agentRepository.Delete(agent);
        await _agentRepository.SaveChangesAsync();
        return true;
    }

    private PersonaDto MapPersonaDto(Agent agent)
    {
        return new PersonaDto
        {
            Id = agent.Id,
            Name = agent.Name,
            Description = agent.Description,
            Instructions = agent.Instructions,
            Avatar = agent.Avatar,
            Provider = Enum.TryParse<ProviderType>(agent.Provider, true, out var provider)
                ? provider
                : ProviderType.Ollama,
            Model = agent.Model,
            Parameters = DeserializeParameters(agent.ModelParametersJson)
        };
    }

    private static string? SerializeParameters(PersonaParametersDto? dto)
    {
        if (dto == null) return null;
        return JsonSerializer.Serialize(dto);
    }

    private static PersonaParametersDto DeserializeParameters(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new PersonaParametersDto();
        try
        {
            return JsonSerializer.Deserialize<PersonaParametersDto>(json) ?? new PersonaParametersDto();
        }
        catch
        {
            return new PersonaParametersDto();
        }
    }
}


