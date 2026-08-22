import { z } from 'zod';

const dayOfWeekEnum = z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']);
const seniorityLevelEnum = z.enum(['ASSISTANT_PROFESSOR', 'ASSOCIATE_PROFESSOR', 'PROFESSOR', 'HOD']);
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const createFacultySchema = z.object({
  fullName: z.string().min(2).max(200),
  email: z.string().email(),
  departmentId: z.string().cuid(),
  seniorityLevel: seniorityLevelEnum,
  maxClassesPerDay: z.number().int().min(1).max(12).default(5),
  maxClassesPerWeek: z.number().int().min(1).max(60).default(20),
  maxContinuousClasses: z.number().int().min(1).max(8).default(3),
  minGapAfterContinuousBlock: z.number().int().min(1).max(4).default(1),
  weeklyWorkingDays: z.array(dayOfWeekEnum).min(1, 'At least one working day required'),
  dailyAvailableFrom: z.string().regex(timeRegex, 'Must be HH:MM format').nullable().optional(),
  dailyAvailableTo: z.string().regex(timeRegex, 'Must be HH:MM format').nullable().optional(),
  isActive: z.boolean().default(true),
});

export const updateFacultySchema = createFacultySchema.partial().omit({ departmentId: true });

export const createFacultyPreferredSubjectSchema = z.object({
  subjectId: z.string().cuid(),
  preferenceRank: z.number().int().min(1),
});

export const createFacultyUnavailabilitySchema = z.object({
  startDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  endDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  reason: z.string().max(500).optional(),
}).refine(data => new Date(data.startDate) <= new Date(data.endDate), {
  message: "End date cannot be before start date",
  path: ["endDate"]
});

export type CreateFacultyInput = z.infer<typeof createFacultySchema>;
export type UpdateFacultyInput = z.infer<typeof updateFacultySchema>;
export type CreateFacultyPreferredSubjectInput = z.infer<typeof createFacultyPreferredSubjectSchema>;
export type CreateFacultyUnavailabilityInput = z.infer<typeof createFacultyUnavailabilitySchema>;
