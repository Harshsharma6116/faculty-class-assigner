import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().min(2).max(200),
  shortCode: z.string().min(2).max(10).regex(/^[A-Z0-9]+$/, 'Short code must be uppercase alphanumeric'),
  schoolId: z.string().cuid(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial().omit({ schoolId: true });

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
