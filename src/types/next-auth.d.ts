// ============================================================================
// NextAuth.js Module Augmentation
// Extends the default Session and JWT types to include our custom fields
// ============================================================================

import type { UserRole } from '@prisma/client';
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  /**
   * Extends the built-in Session type to include role-based access control
   * fields on session.user. These are populated in the session callback
   * from the JWT token.
   */
  interface Session {
    user: {
      id: string;
      role: UserRole | 'FACULTY';
      schoolId: string | null;
      departmentId: string | null;
      avatarUrl?: string | null;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    id: string;
    role: UserRole | 'FACULTY';
    schoolId: string | null;
    departmentId: string | null;
    avatarUrl?: string | null;
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extends the built-in JWT type to carry user identity and RBAC fields
   * between the jwt and session callbacks.
   */
  interface JWT {
    id: string;
    role: UserRole | 'FACULTY';
    schoolId: string | null;
    departmentId: string | null;
  }
}
