import { z } from 'zod';

const seniorityLevelEnum = z.enum(['ASSISTANT_PROFESSOR', 'ASSOCIATE_PROFESSOR', 'PROFESSOR', 'HOD']);
const degreeLevelEnum = z.enum(['UG', 'PG']);

export const updateEligibilitySchema = z.object({
  seniorityLevel: seniorityLevelEnum,
  degreeLevel: degreeLevelEnum,
  allowed: z.boolean(),
});

export const bulkUpdateEligibilitySchema = z.object({
  rules: z.array(updateEligibilitySchema),
});

export type UpdateEligibilityInput = z.infer<typeof updateEligibilitySchema>;
export type BulkUpdateEligibilityInput = z.infer<typeof bulkUpdateEligibilitySchema>;
