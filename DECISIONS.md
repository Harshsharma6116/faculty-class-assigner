# Architecture & Design Decisions

This document records all non-trivial technical decisions made during development.

## Database
- **Supabase PostgreSQL** is used as the managed database provider, but all access goes through Prisma ORM. No Supabase-specific features (Auth, Realtime, Storage) are used. To switch providers, only change `DATABASE_URL` and `DIRECT_URL` in `.env`.
- `directUrl` is configured in Prisma schema for migrations (bypasses connection pooler).

## Authentication
- NextAuth.js v4 with Credentials provider. Passwords hashed with bcrypt (12 salt rounds).
- Session strategy: JWT (stateless, no session table needed).
- Three roles: SUPER_ADMIN, SCHOOL_ADMIN, DEPT_ADMIN. No faculty login in v1.

## Seniority Levels
- Stored as a Prisma enum: ASSISTANT_PROFESSOR, ASSOCIATE_PROFESSOR, PROFESSOR, HOD.
- Changing these levels requires a Prisma migration. For v1 this is acceptable; a lookup table approach would be used if admin-editable levels are needed.

## Semester Scope
- Multiple semesters can be marked active (no hard-enforcement of single active semester). The allocation engine runs against one specific semester at a time.

## Allocation Engine
- Runs synchronously in v1 (expected data sizes: ~100-500 class requirements per semester). For larger institutions, a background job queue (e.g., BullMQ) would be needed.
- Uses deterministic constraint-satisfaction with "most constrained first" heuristic.
- Backtracking retry pass attempts reassignment of CONFLICT items only.

## TimeSlots
- Stored per-school. Default seeded: 8 periods/day, Mon-Sat, 9:00-17:00 with period 5 as lunch break.
- The lunch break period is marked with `isBreak: true` and is excluded from allocation.

## Continuous Classes
- "Consecutive" means adjacent period numbers on the same day with no gap/break period in between.
- A lunch break period naturally breaks continuity.
