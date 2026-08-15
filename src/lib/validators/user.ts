import { z } from 'zod';

const userRoleEnum = z.enum(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'DEPT_ADMIN']);

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: userRoleEnum,
  schoolId: z.string().cuid().optional().nullable(),
  departmentId: z.string().cuid().optional().nullable(),
}).refine(data => {
  if (data.role === 'SCHOOL_ADMIN' && !data.schoolId) {
    return false;
  }
  return true;
}, {
  message: 'School admin must have a school assigned',
  path: ['schoolId'],
}).refine(data => {
  if (data.role === 'DEPT_ADMIN' && !data.departmentId) {
    return false;
  }
  return true;
}, {
  message: 'Department admin must have a department assigned',
  path: ['departmentId'],
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(2).max(100).optional(),
  password: z.string().min(8).optional(),
  role: userRoleEnum.optional(),
  schoolId: z.string().cuid().optional().nullable(),
  departmentId: z.string().cuid().optional().nullable(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
