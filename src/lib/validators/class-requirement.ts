import { z } from 'zod';

export const manualAssignSchema = z.object({
  facultyId: z.string().cuid(),
  timeSlotIds: z.array(z.string().cuid()).min(1),
  overrideWarnings: z.boolean().default(false),
  reason: z.string().max(500).optional(),
});

export const csvImportSchema = z.object({
  rows: z.array(z.object({
    subjectCode: z.string().min(1),
    batchName: z.string().min(1),
    roomName: z.string().min(1),
    sessionsPerWeek: z.number().int().min(1).max(10),
    classType: z.enum(['LECTURE', 'LAB', 'TUTORIAL']).optional(),
  })),
});

export type ManualAssignInput = z.infer<typeof manualAssignSchema>;
export type CsvImportInput = z.infer<typeof csvImportSchema>;
