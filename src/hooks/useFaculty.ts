// ============================================================================
// React Query hooks — Faculty
// Includes CRUD plus preferred-subject and unavailability sub-resource hooks
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse } from '@/types';
import type { Faculty, FacultyPreferredSubject, FacultyUnavailability, Subject } from '@prisma/client';
import type {
  CreateFacultyInput,
  UpdateFacultyInput,
  CreateFacultyPreferredSubjectInput,
  CreateFacultyUnavailabilityInput,
} from '@/lib/validators/faculty';

// ---------------------------------------------------------------------------
// List / single
// ---------------------------------------------------------------------------

export function useFacultyList(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  departmentId?: string;
}) {
  return useQuery({
    queryKey: ['faculty', params],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Faculty>>(
        '/api/faculty',
        params as Record<string, string | number>
      ),
  });
}

export function useFaculty(id: string) {
  return useQuery({
    queryKey: ['faculty', id],
    queryFn: () => apiClient.get<Faculty>(`/api/faculty/${id}`),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// CRUD mutations
// ---------------------------------------------------------------------------

export function useCreateFaculty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFacultyInput) =>
      apiClient.post<Faculty>('/api/faculty', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['faculty'] }),
  });
}

export function useUpdateFaculty(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateFacultyInput) =>
      apiClient.patch<Faculty>(`/api/faculty/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
      queryClient.invalidateQueries({ queryKey: ['faculty', id] });
    },
  });
}

export function useDeleteFaculty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/faculty/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['faculty'] }),
  });
}

// ---------------------------------------------------------------------------
// Preferred subjects sub-resource
// ---------------------------------------------------------------------------

export function useFacultyPreferredSubjects(facultyId: string) {
  return useQuery({
    queryKey: ['faculty', facultyId, 'preferred-subjects'],
    queryFn: () =>
      apiClient.get<(FacultyPreferredSubject & { subject: Subject })[]>(
        `/api/faculty/${facultyId}/preferred-subjects`
      ),
    enabled: !!facultyId,
  });
}

export function useAddPreferredSubject(facultyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFacultyPreferredSubjectInput) =>
      apiClient.post<FacultyPreferredSubject>(
        `/api/faculty/${facultyId}/preferred-subjects`,
        data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty', facultyId] });
    },
  });
}

export function useRemovePreferredSubject(facultyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subjectId: string) =>
      apiClient.delete(`/api/faculty/${facultyId}/preferred-subjects/${subjectId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty', facultyId] });
    },
  });
}

// ---------------------------------------------------------------------------
// Unavailability sub-resource
// ---------------------------------------------------------------------------

export function useFacultyUnavailability(facultyId: string) {
  return useQuery({
    queryKey: ['faculty', facultyId, 'unavailability'],
    queryFn: () =>
      apiClient.get<FacultyUnavailability[]>(
        `/api/faculty/${facultyId}/unavailability`
      ),
    enabled: !!facultyId,
  });
}

export function useAddUnavailability(facultyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFacultyUnavailabilityInput) =>
      apiClient.post<FacultyUnavailability>(
        `/api/faculty/${facultyId}/unavailability`,
        data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty', facultyId] });
    },
  });
}

export function useRemoveUnavailability(facultyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (unavailabilityId: string) =>
      apiClient.delete(`/api/faculty/${facultyId}/unavailability/${unavailabilityId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty', facultyId] });
    },
  });
}
