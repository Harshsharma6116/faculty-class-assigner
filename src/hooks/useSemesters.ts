// ============================================================================
// React Query hooks — Semesters
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse } from '@/types';
import type { Semester } from '@prisma/client';
import type { CreateSemesterInput, UpdateSemesterInput } from '@/lib/validators/semester';

export function useSemesters(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: ['semesters', params],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Semester>>(
        '/api/semesters',
        params as Record<string, string | number>
      ),
  });
}

export function useSemester(id: string) {
  return useQuery({
    queryKey: ['semesters', id],
    queryFn: () => apiClient.get<Semester>(`/api/semesters/${id}`),
    enabled: !!id,
  });
}

export function useCreateSemester() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSemesterInput) =>
      apiClient.post<Semester>('/api/semesters', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['semesters'] }),
  });
}

export function useUpdateSemester(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateSemesterInput) =>
      apiClient.patch<Semester>(`/api/semesters/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['semesters'] });
      queryClient.invalidateQueries({ queryKey: ['semesters', id] });
    },
  });
}

export function useDeleteSemester() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/semesters/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['semesters'] }),
  });
}
