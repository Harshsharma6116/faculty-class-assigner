import { z } from 'zod';

const roomTypeEnum = z.enum(['LECTURE_HALL', 'LAB', 'SEMINAR_ROOM']);

export const createRoomSchema = z.object({
  name: z.string().min(1).max(50),
  capacity: z.number().int().min(1).max(1000),
  roomType: roomTypeEnum,
  schoolId: z.string().cuid(),
});

export const updateRoomSchema = createRoomSchema.partial().omit({ schoolId: true });

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
