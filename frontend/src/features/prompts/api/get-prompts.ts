import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Prompt, PromptPayload } from '../types';

const getPrompts = async (): Promise<Prompt[]> => {
  const data = await api.get('/prompts');
  const list = Array.isArray(data) ? data : [];
  return list.map((prompt: any) => ({
    id: prompt.id ?? prompt.Id,
    userId: prompt.userId ?? prompt.user_id ?? 0,
    title: prompt.title ?? prompt.Title,
    content: prompt.content ?? prompt.Content ?? '',
    tags: prompt.tags ?? prompt.Tags ?? [],
    variables: prompt.variables ?? prompt.Variables ?? [],
  }));
};

export const usePrompts = () =>
  useQuery({
    queryKey: ['prompts'],
    queryFn: getPrompts,
  });

export const useCreatePrompt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PromptPayload) => api.post('/prompts', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
    },
  });
};

export const useUpdatePrompt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<PromptPayload> }) =>
      api.put(`/prompts/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
    },
  });
};

export const useDeletePrompt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/prompts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
    },
  });
};

