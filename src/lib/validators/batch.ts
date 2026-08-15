import { z } from 'zod';

const degreeLevelEnum = z.enum(['UG', 'PG']);

export const createBatchSchema = z.object({
  name: z.string().min(2).max(50),
  departmentId: z.string().cuid(),
  semesterId: z.string().cuid(),
  degreeLevel: degreeLevelEnum,
  yearOrSemesterNumber: z.number().int().min(1).max(10),
  strength: z.number().int().min(1).max(500),
});

export const updateBatchSchema = createBatchSchema.partial().omit({ semesterId: true, departmentId: true });

export type CreateBatchInput = z.infer<typeof createBatchSchema>;
export type UpdateBatchInput = z.infer<typeof updateBatchSchema>;
