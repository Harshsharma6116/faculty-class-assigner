// ============================================================================
// React Query hooks — Allocation, Timetable, Class Requirements & Audit Logs
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse } from '@/types';
import type { AllocationResult, TimetableGrid } from '@/types';
import type { AllocationRun, ClassRequirement, AuditLog } from '@prisma/client';

// ---------------------------------------------------------------------------
// Run allocation engine
// ---------------------------------------------------------------------------

export function useRunAllocation(semesterId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient.post<AllocationResult>(`/api/semesters/${semesterId}/allocate`),
    onSuccess: () => {
      // Refresh allocation-related queries after a run
      queryClient.invalidateQueries({ queryKey: ['allocationRuns', semesterId] });
      queryClient.invalidateQueries({ queryKey: ['classRequirements'] });
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Allocation run history
// ---------------------------------------------------------------------------

export function useAllocationRuns(semesterId: string) {
  return useQuery({
    queryKey: ['allocationRuns', semesterId],
    queryFn: () =>
      apiClient.get<AllocationRun[]>(`/api/semesters/${semesterId}/allocation-runs`),
    enabled: !!semesterId,
  });
}

// ---------------------------------------------------------------------------
// Manual assignment
// ---------------------------------------------------------------------------

export interface ManualAssignInput {
  facultyId: string;
  timeSlotIds: string[];
  reason?: string;
}

export function useManualAssign(classRequirementId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ManualAssignInput) =>
      apiClient.post<ClassRequirement>(
        `/api/class-requirements/${classRequirementId}/manual-assign`,
        data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classRequirements'] });
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Timetable view
// ---------------------------------------------------------------------------

export function useTimetable(params: {
  semesterId: string;
  facultyId?: string;
  batchId?: string;
  roomId?: string;
}) {
  return useQuery({
    queryKey: ['timetable', params],
    queryFn: () =>
      apiClient.get<TimetableGrid>(
        '/api/timetable',
        params as Record<string, string | number>
      ),
    enabled: !!params.semesterId,
  });
}

// ---------------------------------------------------------------------------
// Class requirements
// ---------------------------------------------------------------------------

export function useClassRequirements(params: {
  semesterId: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ['classRequirements', params],
    queryFn: () =>
      apiClient.get<PaginatedResponse<ClassRequirement>>(
        '/api/class-requirements',
        params as Record<string, string | number>
      ),
    enabled: !!params.semesterId,
  });
}

// ---------------------------------------------------------------------------
// Audit logs
// ---------------------------------------------------------------------------

export function useAuditLogs(params?: {
  page?: number;
  pageSize?: number;
  entityType?: string;
  entityId?: string;
}) {
  return useQuery({
    queryKey: ['auditLogs', params],
    queryFn: () =>
      apiClient.get<PaginatedResponse<AuditLog>>(
        '/api/audit-logs',
        params as Record<string, string | number>
      ),
  });
}
