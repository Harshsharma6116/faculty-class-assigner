// ============================================================================
// React Query hooks — Time Slots
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse } from '@/types';
import type { TimeSlot } from '@prisma/client';

/** Input type for creating a time slot (no validator file yet, so inline) */
export interface CreateTimeSlotInput {
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
  periodNumber: number;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  schoolId: string;
  isBreak?: boolean;
}

/** Input type for updating a time slot */
export type UpdateTimeSlotInput = Partial<Omit<CreateTimeSlotInput, 'schoolId'>>;

export function useTimeSlots(params?: {
  page?: number;
  pageSize?: number;
  schoolId?: string;
}) {
  return useQuery({
    queryKey: ['timeSlots', params],
    queryFn: () =>
      apiClient.get<PaginatedResponse<TimeSlot>>(
        '/api/time-slots',
        params as Record<string, string | number>
      ),
  });
}

export function useCreateTimeSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTimeSlotInput) =>
      apiClient.post<TimeSlot>('/api/time-slots', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timeSlots'] }),
  });
}

export function useUpdateTimeSlot(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateTimeSlotInput) =>
      apiClient.patch<TimeSlot>(`/api/time-slots/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeSlots'] });
    },
  });
}

export function useDeleteTimeSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/time-slots/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timeSlots'] }),
  });
}
