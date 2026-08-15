// ============================================================================
// React Query hooks — Departments
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse } from '@/types';
import type { Department } from '@prisma/client';
import type { CreateDepartmentInput, UpdateDepartmentInput } from '@/lib/validators/department';

export function useDepartments(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  schoolId?: string;
}) {
  return useQuery({
    queryKey: ['departments', params],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Department>>(
        '/api/departments',
        params as Record<string, string | number>
      ),
  });
}

export function useDepartment(id: string) {
  return useQuery({
    queryKey: ['departments', id],
    queryFn: () => apiClient.get<Department>(`/api/departments/${id}`),
    enabled: !!id,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDepartmentInput) =>
      apiClient.post<Department>('/api/departments', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] }),
  });
}

export function useUpdateDepartment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateDepartmentInput) =>
      apiClient.patch<Department>(`/api/departments/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['departments', id] });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/departments/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] }),
  });
}
