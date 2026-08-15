// ============================================================================
// Auth Helper Functions
// requireAuth()  — gate API routes behind authentication + role checks
// scopeFilter*() — generate Prisma where-clauses scoped to the user's org
// ============================================================================

import { getServerSession } from 'next-auth';
import type { UserRole } from '@prisma/client';
import { authOptions } from '@/lib/auth/auth-options';
import { ApiError } from '@/lib/auth/api-error';
import type { SessionUser } from '@/types';

// ============================================================================
// requireAuth — authenticate + optionally authorize by role
// ============================================================================

/**
 * Retrieves the current session and enforces authentication.
 * Optionally restricts access to a list of allowed roles.
 *
 * @param allowedRoles - If provided, the user's role must be in this list.
 * @returns The authenticated session user with typed RBAC fields.
 * @throws ApiError(401) if no session exists.
 * @throws ApiError(403) if the user's role is not in `allowedRoles`.
 *
 * @example
 * ```ts
 * // Any authenticated user
 * const user = await requireAuth();
 *
 * // Only SUPER_ADMIN or SCHOOL_ADMIN
 * const user = await requireAuth(['SUPER_ADMIN', 'SCHOOL_ADMIN']);
 * ```
 */
export async function requireAuth(allowedRoles?: UserRole[]): Promise<SessionUser> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new ApiError(401, 'Authentication required');
  }

  const user = session.user as SessionUser;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new ApiError(403, 'Insufficient permissions');
  }

  return user;
}

// ============================================================================
// Scope filters — Prisma where-clause builders based on user role
// ============================================================================

/**
 * Generic scope filter. Returns a Prisma-compatible where clause that
 * restricts queries to the user's organizational scope.
 *
 * - SUPER_ADMIN  → {} (no filter, full access)
 * - SCHOOL_ADMIN → { schoolId: user.schoolId }
 * - DEPT_ADMIN   → { departmentId: user.departmentId }
 *
 * Best used on models that directly have schoolId or departmentId fields.
 */
export function scopeFilter(user: SessionUser): Record<string, unknown> {
  switch (user.role) {
    case 'SUPER_ADMIN':
      return {};
    case 'SCHOOL_ADMIN':
      return { schoolId: user.schoolId };
    case 'DEPT_ADMIN':
      return { departmentId: user.departmentId };
    default:
      // Defensive: deny access if role is somehow unrecognized
      throw new ApiError(403, 'Unknown role');
  }
}

/**
 * Scope filter for School queries.
 *
 * - SUPER_ADMIN  → {} (all schools)
 * - SCHOOL_ADMIN → { id: user.schoolId } (their own school)
 * - DEPT_ADMIN   → { departments: { some: { id: user.departmentId } } }
 *                   (the school containing their department)
 */
export function scopeFilterForSchool(user: SessionUser): Record<string, unknown> {
  switch (user.role) {
    case 'SUPER_ADMIN':
      return {};
    case 'SCHOOL_ADMIN':
      return { id: user.schoolId };
    case 'DEPT_ADMIN':
      return { departments: { some: { id: user.departmentId } } };
    default:
      throw new ApiError(403, 'Unknown role');
  }
}

/**
 * Scope filter for Department queries.
 *
 * - SUPER_ADMIN  → {} (all departments)
 * - SCHOOL_ADMIN → { schoolId: user.schoolId } (departments in their school)
 * - DEPT_ADMIN   → { id: user.departmentId } (their own department)
 */
export function scopeFilterForDepartment(user: SessionUser): Record<string, unknown> {
  switch (user.role) {
    case 'SUPER_ADMIN':
      return {};
    case 'SCHOOL_ADMIN':
      return { schoolId: user.schoolId };
    case 'DEPT_ADMIN':
      return { id: user.departmentId };
    default:
      throw new ApiError(403, 'Unknown role');
  }
}

/**
 * Scope filter for Faculty queries.
 *
 * - SUPER_ADMIN  → {} (all faculty)
 * - SCHOOL_ADMIN → { department: { schoolId: user.schoolId } }
 *                   (faculty in departments belonging to their school)
 * - DEPT_ADMIN   → { departmentId: user.departmentId }
 *                   (faculty in their own department)
 */
export function scopeFilterForFaculty(user: SessionUser): Record<string, unknown> {
  switch (user.role) {
    case 'SUPER_ADMIN':
      return {};
    case 'SCHOOL_ADMIN':
      return { department: { schoolId: user.schoolId } };
    case 'DEPT_ADMIN':
      return { departmentId: user.departmentId };
    default:
      throw new ApiError(403, 'Unknown role');
  }
}

/**
 * Scope filter for Subject queries.
 *
 * Same scope rules as Faculty since both belong to a Department.
 */
export function scopeFilterForSubject(user: SessionUser): Record<string, unknown> {
  return scopeFilterForFaculty(user);
}

/**
 * Scope filter for Batch queries.
 * Same scope rules as Faculty since both belong to a Department.
 */
export function scopeFilterForBatch(user: SessionUser): Record<string, unknown> {
  return scopeFilterForFaculty(user);
}

/**
 * Scope filter for Room queries.
 * Rooms belong to a School.
 * DEPT_ADMIN can view rooms in their school.
 */
export function scopeFilterForRoom(user: SessionUser): Record<string, unknown> {
  switch (user.role) {
    case 'SUPER_ADMIN':
      return {};
    case 'SCHOOL_ADMIN':
      return { schoolId: user.schoolId };
    case 'DEPT_ADMIN':
      return { schoolId: user.schoolId }; // Depends on how session has schoolId, let's look at SessionUser
    default:
      throw new ApiError(403, 'Unknown role');
  }
}

/**
 * Scope filter for TimeSlot queries.
 * TimeSlots belong to a School.
 */
export function scopeFilterForTimeSlot(user: SessionUser): Record<string, unknown> {
  return scopeFilterForRoom(user);
}

