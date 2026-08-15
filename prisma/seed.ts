// ============================================================================
// Prisma Seed Script
// Runs outside Next.js — uses PrismaClient directly, NOT the app singleton.
// All operations use upsert for idempotency (safe to run multiple times).
// ============================================================================

import { PrismaClient, SeniorityLevel, DegreeLevel, DayOfWeek } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Validates that required env vars are set; throws if missing. */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is required but not set.`);
  }
  return value;
}

// ---------------------------------------------------------------------------
// Seed: Super Admin User
// ---------------------------------------------------------------------------

async function seedSuperAdmin() {
  const email = requireEnv('SEED_ADMIN_EMAIL');
  const password = requireEnv('SEED_ADMIN_PASSWORD');

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: 'Super Admin',
      hashedPassword,
      role: 'SUPER_ADMIN',
    },
    create: {
      email,
      name: 'Super Admin',
      hashedPassword,
      role: 'SUPER_ADMIN',
    },
  });

  console.log(`✔ Super Admin upserted: ${user.email} (id: ${user.id})`);
  return user;
}

// ---------------------------------------------------------------------------
// Seed: Seniority × Degree Eligibility Rules
// ---------------------------------------------------------------------------

async function seedEligibilityRules() {
  const seniorityLevels: SeniorityLevel[] = [
    'ASSISTANT_PROFESSOR',
    'ASSOCIATE_PROFESSOR',
    'PROFESSOR',
    'HOD',
  ];
  const degreeLevels: DegreeLevel[] = ['UG', 'PG'];

  let count = 0;

  for (const seniority of seniorityLevels) {
    for (const degree of degreeLevels) {
      // All combinations are allowed EXCEPT Assistant Professor + PG
      const allowed = !(seniority === 'ASSISTANT_PROFESSOR' && degree === 'PG');

      await prisma.seniorityDegreeEligibility.upsert({
        where: {
          seniorityLevel_degreeLevel: {
            seniorityLevel: seniority,
            degreeLevel: degree,
          },
        },
        update: { allowed },
        create: {
          seniorityLevel: seniority,
          degreeLevel: degree,
          allowed,
        },
      });

      count++;
      console.log(
        `  ${allowed ? '✔' : '✘'} ${seniority} + ${degree} → ${allowed ? 'ALLOWED' : 'DENIED'}`,
      );
    }
  }

  console.log(`✔ Eligibility rules upserted: ${count} combinations`);
}

// ---------------------------------------------------------------------------
// Seed: Sample School
// ---------------------------------------------------------------------------

async function seedSchool() {
  const school = await prisma.school.upsert({
    where: { shortCode: 'ASET' },
    update: {
      name: 'Amity School of Engineering and Technology',
    },
    create: {
      name: 'Amity School of Engineering and Technology',
      shortCode: 'ASET',
    },
  });

  console.log(`✔ School upserted: ${school.name} (${school.shortCode}, id: ${school.id})`);
  return school;
}

// ---------------------------------------------------------------------------
// Seed: Default Time Slots
// ---------------------------------------------------------------------------

interface PeriodDef {
  periodNumber: number;
  startTime: string;
  endTime: string;
  isBreak: boolean;
}

const PERIODS: PeriodDef[] = [
  { periodNumber: 1, startTime: '09:00', endTime: '10:00', isBreak: false },
  { periodNumber: 2, startTime: '10:00', endTime: '11:00', isBreak: false },
  { periodNumber: 3, startTime: '11:00', endTime: '12:00', isBreak: false },
  { periodNumber: 4, startTime: '12:00', endTime: '13:00', isBreak: false },
  { periodNumber: 5, startTime: '13:00', endTime: '14:00', isBreak: true },  // Lunch break
  { periodNumber: 6, startTime: '14:00', endTime: '15:00', isBreak: false },
  { periodNumber: 7, startTime: '15:00', endTime: '16:00', isBreak: false },
  { periodNumber: 8, startTime: '16:00', endTime: '17:00', isBreak: false },
];

const DAYS: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

async function seedTimeSlots(schoolId: string) {
  let count = 0;

  for (const day of DAYS) {
    for (const period of PERIODS) {
      await prisma.timeSlot.upsert({
        where: {
          schoolId_dayOfWeek_periodNumber: {
            schoolId,
            dayOfWeek: day,
            periodNumber: period.periodNumber,
          },
        },
        update: {
          startTime: period.startTime,
          endTime: period.endTime,
          isBreak: period.isBreak,
        },
        create: {
          schoolId,
          dayOfWeek: day,
          periodNumber: period.periodNumber,
          startTime: period.startTime,
          endTime: period.endTime,
          isBreak: period.isBreak,
        },
      });

      count++;
    }
  }

  console.log(`✔ TimeSlots upserted: ${count} slots (${DAYS.length} days × ${PERIODS.length} periods)`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('🌱 Seeding database...\n');

  await seedSuperAdmin();
  console.log('');

  await seedEligibilityRules();
  console.log('');

  const school = await seedSchool();
  console.log('');

  await seedTimeSlots(school.id);
  console.log('');

  console.log('🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
