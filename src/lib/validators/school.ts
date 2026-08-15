// ============================================================================
// Zod Validators — School
// ============================================================================

import { z } from 'zod';

export const createSchoolSchema = z.object({
  name: z.string().min(2, 'School name must be at least 2 characters').max(200),
  shortCode: z.string()
    .min(2, 'Short code must be at least 2 characters')
    .max(10, 'Short code must be at most 10 characters')
    .regex(/^[A-Z0-9]+$/, 'Short code must be uppercase alphanumeric'),
});

export const updateSchoolSchema = createSchoolSchema.partial();

export type CreateSchoolInput = z.infer<typeof createSchoolSchema>;
export type UpdateSchoolInput = z.infer<typeof updateSchoolSchema>;
