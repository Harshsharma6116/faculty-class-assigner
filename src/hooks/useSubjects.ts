// ============================================================================
// React Query hooks — Subjects
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse } from '@/types';
import type { Subject } from '@prisma/client';
import type { CreateSubjectInput, UpdateSubjectInput } from '@/lib/validators/subject';

export function useSubjects(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  departmentId?: string;
}) {
  return useQuery({
    queryKey: ['subjects', params],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Subject>>(
        '/api/subjects',
        params as Record<string, string | number>
      ),
  });
}

export function useSubject(id: string) {
  return useQuery({
    queryKey: ['subjects', id],
    queryFn: () => apiClient.get<Subject>(`/api/subjects/${id}`),
    enabled: !!id,
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSubjectInput) =>
      apiClient.post<Subject>('/api/subjects', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subjects'] }),
  });
}

export function useUpdateSubject(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateSubjectInput) =>
      apiClient.patch<Subject>(`/api/subjects/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['subjects', id] });
    },
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/subjects/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subjects'] }),
  });
}
