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
        turnstileToken: { label: 'Turnstile Token', type: 'text' },
      },

      async authorize(credentials, req) {
        // Validate that both fields were provided
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const email = credentials.email.toLowerCase().trim();
        
        // Extract IP address from request headers
        // NextAuth req.headers is a Record<string, string> in this context
        let ip = 'unknown';
        if (req?.headers) {
          const forwarded = req.headers['x-forwarded-for'];
          if (typeof forwarded === 'string') {
            ip = forwarded.split(',')[0].trim();
          }
        }

        const turnstileToken = credentials.turnstileToken;

        // Rate Limiting Check
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
        const recentAttempts = await prisma.loginAttempt.count({
          where: {
            OR: [{ email }, { ipAddress: ip }],
            createdAt: { gte: fifteenMinsAgo },
            success: false,
          }
        });

        if (recentAttempts > 10) {
          throw new Error('Too many attempts. Please try again later.');
        }

        if (recentAttempts > 3 && !turnstileToken) {
          throw new Error('TURNSTILE_REQUIRED');
        }

        // Verify Turnstile if provided
        if (turnstileToken) {
          const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `secret=${process.env.TURNSTILE_SECRET_KEY}&response=${turnstileToken}&remoteip=${ip}`
          });
          const verifyData = await verifyRes.json();
          if (!verifyData.success) {
            throw new Error('Verification failed. Please try again.');
          }
        }

        // Look up the user by email
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          // Log failed attempt without revealing user existence
          await prisma.loginAttempt.create({ data: { email, ipAddress: ip, success: false } });
          throw new Error('Unable to sign in. Please verify your details and try again.');
        }

        // Verify the password against the stored hash
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isPasswordValid) {
          // Log failed attempt
          await prisma.loginAttempt.create({ data: { email, ipAddress: ip, success: false } });
          throw new Error('Unable to sign in. Please verify your details and try again.');
        }

        // Log successful attempt
        await prisma.loginAttempt.create({ data: { email, ipAddress: ip, success: true } });

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
