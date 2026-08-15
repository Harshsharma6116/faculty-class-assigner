// ============================================================================
// NextAuth.js API Route Handler
// Handles all /api/auth/* routes (sign-in, sign-out, session, CSRF, etc.)
// ============================================================================

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
