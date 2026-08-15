// ============================================================================
// React Query hooks — Eligibility Rules
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { SeniorityDegreeEligibility } from '@prisma/client';

/** Payload shape for bulk-updating eligibility rules */
export interface UpdateEligibilityRulesInput {
  rules: Array<{
    seniorityLevel: 'ASSISTANT_PROFESSOR' | 'ASSOCIATE_PROFESSOR' | 'PROFESSOR' | 'HOD';
    degreeLevel: 'UG' | 'PG';
    allowed: boolean;
  }>;
}

export function useEligibilityRules() {
  return useQuery({
    queryKey: ['eligibilityRules'],
    queryFn: () =>
      apiClient.get<SeniorityDegreeEligibility[]>('/api/eligibility-rules'),
  });
}

export function useUpdateEligibilityRules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateEligibilityRulesInput) =>
      apiClient.post<SeniorityDegreeEligibility[]>('/api/eligibility-rules', data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['eligibilityRules'] }),
  });
}
