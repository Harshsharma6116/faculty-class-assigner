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

        // NextAuth serializes all payload fields to strings, so null becomes "null"
        let turnstileToken: string | undefined = credentials.turnstileToken;
        if (turnstileToken === 'null' || turnstileToken === 'undefined' || turnstileToken === '') {
          turnstileToken = undefined;
        }

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

        // 1. Look up the user by email in the Admin User table
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (user) {
          // Verify the password against the stored hash for Admin User
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.hashedPassword
          );

          if (!isPasswordValid) {
            await prisma.loginAttempt.create({ data: { email, ipAddress: ip, success: false } });
            throw new Error('Unable to sign in. Please verify your details and try again.');
          }

          await prisma.loginAttempt.create({ data: { email, ipAddress: ip, success: true } });
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            schoolId: user.schoolId,
            departmentId: user.departmentId,
            avatarUrl: user.avatarUrl,
          };
        }

        // 2. If not an Admin User, look up in the Faculty table
        const faculty = await prisma.faculty.findUnique({
          where: { email },
        });

        if (faculty && faculty.hashedPassword) {
          // Verify the password against the stored hash for Faculty
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            faculty.hashedPassword
          );

          if (!isPasswordValid) {
            await prisma.loginAttempt.create({ data: { email, ipAddress: ip, success: false } });
            throw new Error('Unable to sign in. Please verify your details and try again.');
          }

          if (!faculty.isActive) {
            await prisma.loginAttempt.create({ data: { email, ipAddress: ip, success: false } });
            throw new Error('Your account has been deactivated. Please contact an administrator.');
          }

          await prisma.loginAttempt.create({ data: { email, ipAddress: ip, success: true } });

          return {
            id: faculty.id,
            email: faculty.email,
            name: faculty.fullName,
            role: 'FACULTY', // Virtual role injected for Faculty
            schoolId: null,  // Faculty are tied to departments directly
            departmentId: faculty.departmentId,
            avatarUrl: faculty.avatarUrl,
          };
        }

        // 3. Not found in either table or no password set
        await prisma.loginAttempt.create({ data: { email, ipAddress: ip, success: false } });
        throw new Error('Unable to sign in. Please verify your details and try again.');
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
    async jwt({ token, user, trigger, session: updateData }) {
      if (user) {
        // Initial sign-in: transfer custom fields from the user object
        // returned by authorize() onto the JWT token.
        token.id = user.id;
        token.role = user.role as import('@prisma/client').UserRole;
        token.schoolId = user.schoolId as string | null;
        token.departmentId = user.departmentId as string | null;
        token.avatarUrl = user.avatarUrl as string | null;
      }

      // When session.update() is called from the client, merge the new data
      if (trigger === 'update' && updateData) {
        if (updateData.name) token.name = updateData.name;
        if (typeof updateData.avatarUrl !== 'undefined') token.avatarUrl = updateData.avatarUrl;
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
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        session.user.schoolId = token.schoolId as string | null;
        session.user.departmentId = token.departmentId as string | null;
        session.user.avatarUrl = token.avatarUrl as string | null;
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
