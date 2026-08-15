// ============================================================================
// React Query hooks — Rooms
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse } from '@/types';
import type { Room } from '@prisma/client';

/** Input type for creating a room (no validator file yet, so inline) */
export interface CreateRoomInput {
  name: string;
  capacity: number;
  roomType: 'LECTURE_HALL' | 'LAB' | 'SEMINAR_ROOM';
  schoolId: string;
}

/** Input type for updating a room */
export type UpdateRoomInput = Partial<Omit<CreateRoomInput, 'schoolId'>>;

export function useRooms(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  schoolId?: string;
}) {
  return useQuery({
    queryKey: ['rooms', params],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Room>>(
        '/api/rooms',
        params as Record<string, string | number>
      ),
  });
}

export function useRoom(id: string) {
  return useQuery({
    queryKey: ['rooms', id],
    queryFn: () => apiClient.get<Room>(`/api/rooms/${id}`),
    enabled: !!id,
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRoomInput) =>
      apiClient.post<Room>('/api/rooms', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] }),
  });
}

export function useUpdateRoom(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateRoomInput) =>
      apiClient.patch<Room>(`/api/rooms/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['rooms', id] });
    },
  });
}

export function useDeleteRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/rooms/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] }),
  });
}
