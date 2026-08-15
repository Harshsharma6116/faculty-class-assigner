import { z } from 'zod';

const degreeLevelEnum = z.enum(['UG', 'PG']);
const classTypeEnum = z.enum(['LECTURE', 'LAB', 'TUTORIAL']);

export const createSubjectSchema = z.object({
  name: z.string().min(2).max(200),
  code: z.string().min(2).max(20).regex(/^[A-Z0-9-]+$/, 'Code must be uppercase alphanumeric with hyphens'),
  departmentId: z.string().cuid(),
  degreeLevel: degreeLevelEnum,
  classType: classTypeEnum,
  weeklyClassesRequired: z.number().int().min(1).max(10),
  creditHours: z.number().int().min(0).max(10).optional().nullable(),
});

export const updateSubjectSchema = createSubjectSchema.partial().omit({ departmentId: true });

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
