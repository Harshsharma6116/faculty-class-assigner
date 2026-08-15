// ============================================================================
// React Query hooks — Schools
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse } from '@/types';
import type { School } from '@prisma/client';
import type { CreateSchoolInput, UpdateSchoolInput } from '@/lib/validators/school';

export function useSchools(params?: { page?: number; pageSize?: number; search?: string }) {
  return useQuery({
    queryKey: ['schools', params],
    queryFn: () =>
      apiClient.get<PaginatedResponse<School>>('/api/schools', params as Record<string, string | number>),
  });
}

export function useSchool(id: string) {
  return useQuery({
    queryKey: ['schools', id],
    queryFn: () => apiClient.get<School>(`/api/schools/${id}`),
    enabled: !!id,
  });
}

export function useCreateSchool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSchoolInput) =>
      apiClient.post<School>('/api/schools', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['schools'] }),
  });
}

export function useUpdateSchool(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateSchoolInput) =>
      apiClient.patch<School>(`/api/schools/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      queryClient.invalidateQueries({ queryKey: ['schools', id] });
    },
  });
}

export function useDeleteSchool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/schools/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['schools'] }),
  });
}
