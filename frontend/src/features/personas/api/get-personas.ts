import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Persona, PersonaPayload } from '../types';

const getPersonas = async (): Promise<Persona[]> => {
  const data = await api.get('/personas');
  const list = Array.isArray(data) ? data : [];
  return list.map((persona: any) => ({
    id: persona.id ?? persona.Id,
    name: persona.name ?? persona.Name,
    description: persona.description ?? persona.Description,
    instructions: persona.instructions ?? persona.Instructions ?? '',
    avatar: persona.avatar ?? persona.Avatar,
    provider: persona.provider ?? persona.Provider,
    model: persona.model ?? persona.Model,
    parameters: persona.parameters ?? persona.Parameters ?? {},
  }));
};

export const usePersonas = () =>
  useQuery({
    queryKey: ['personas'],
    queryFn: getPersonas,
  });

export const useCreatePersona = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PersonaPayload) => api.post('/personas', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas'] });
    },
  });
};

export const useUpdatePersona = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<PersonaPayload> }) =>
      api.put(`/personas/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas'] });
    },
  });
};

export const useDeletePersona = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/personas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas'] });
    },
  });
};

