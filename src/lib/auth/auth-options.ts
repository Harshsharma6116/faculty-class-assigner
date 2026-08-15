// ============================================================================
// NextAuth.js Configuration
// Uses Credentials provider with email + password, JWT strategy
// ============================================================================

import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  // ---------------------------------------------------------------------------
  // Providers
  // ---------------------------------------------------------------------------
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'admin@example.com' },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials) {
        // Validate that both fields were provided
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        // Look up the user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user) {
          throw new Error('Invalid email or password');
        }

        // Verify the password against the stored hash
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        // Return the user object that NextAuth will pass to the jwt callback.
        // Only include fields we need — never return the hashed password.
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          schoolId: user.schoolId,
          departmentId: user.departmentId,
        };
      },
    }),
  ],

  // ---------------------------------------------------------------------------
  // Session strategy — stateless JWTs (no database session table needed)
  // ---------------------------------------------------------------------------
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },

  // ---------------------------------------------------------------------------
  // Callbacks
  // ---------------------------------------------------------------------------
  callbacks: {
    /**
     * JWT callback — runs when a JWT is created (sign-in) or updated.
     * On initial sign-in, `user` is populated from `authorize()`.
     * On subsequent requests, only `token` is available — so we persist
     * our custom fields onto the token during sign-in.
     */
    async jwt({ token, user }) {
      if (user) {
        // Initial sign-in: transfer custom fields from the user object
        // returned by authorize() onto the JWT token.
        token.id = user.id;
        token.role = user.role as import('@prisma/client').UserRole;
        token.schoolId = user.schoolId as string | null;
        token.departmentId = user.departmentId as string | null;
      }
      return token;
    },

    /**
     * Session callback — constructs the session object sent to the client.
     * IMPORTANT: Always read from `token`, NOT from `user`. The `user`
     * parameter is only available on the initial sign-in call; on
     * subsequent requests it is undefined.
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.schoolId = token.schoolId;
        session.user.departmentId = token.departmentId;
      }
      return session;
    },
  },

  // ---------------------------------------------------------------------------
  // Pages — custom sign-in page (will be created later)
  // ---------------------------------------------------------------------------
  pages: {
    signIn: '/login',
  },

  // ---------------------------------------------------------------------------
  // Secret — used to sign/encrypt JWTs
  // ---------------------------------------------------------------------------
  secret: process.env.NEXTAUTH_SECRET,
};
