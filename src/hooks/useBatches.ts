// ============================================================================
// React Query hooks — Batches
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse } from '@/types';
import type { Batch } from '@prisma/client';

/** Input type for creating a batch (no validator file yet, so inline) */
export interface CreateBatchInput {
  name: string;
  departmentId: string;
  semesterId: string;
  degreeLevel: 'UG' | 'PG';
  yearOrSemesterNumber: number;
  strength: number;
}

/** Input type for updating a batch */
export type UpdateBatchInput = Partial<Omit<CreateBatchInput, 'departmentId' | 'semesterId'>>;

export function useBatches(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  semesterId?: string;
  departmentId?: string;
}) {
  return useQuery({
    queryKey: ['batches', params],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Batch>>(
        '/api/batches',
        params as Record<string, string | number>
      ),
  });
}

export function useBatch(id: string) {
  return useQuery({
    queryKey: ['batches', id],
    queryFn: () => apiClient.get<Batch>(`/api/batches/${id}`),
    enabled: !!id,
  });
}

export function useCreateBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBatchInput) =>
      apiClient.post<Batch>('/api/batches', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['batches'] }),
  });
}

export function useUpdateBatch(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateBatchInput) =>
      apiClient.patch<Batch>(`/api/batches/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['batches', id] });
    },
  });
}

export function useDeleteBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/batches/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['batches'] }),
  });
}
