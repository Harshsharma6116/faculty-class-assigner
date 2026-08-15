import { z } from 'zod';

const dayOfWeekEnum = z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']);
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const createTimeSlotSchema = z.object({
  dayOfWeek: dayOfWeekEnum,
  periodNumber: z.number().int().min(1).max(12),
  startTime: z.string().regex(timeRegex, 'Must be HH:MM format'),
  endTime: z.string().regex(timeRegex, 'Must be HH:MM format'),
  schoolId: z.string().cuid(),
  isBreak: z.boolean().default(false),
});

export const updateTimeSlotSchema = createTimeSlotSchema.partial().omit({ schoolId: true });

export type CreateTimeSlotInput = z.infer<typeof createTimeSlotSchema>;
export type UpdateTimeSlotInput = z.infer<typeof updateTimeSlotSchema>;
