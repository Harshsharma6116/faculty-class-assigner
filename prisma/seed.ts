// ============================================================================
// Prisma Seed Script
// Runs outside Next.js — uses PrismaClient directly, NOT the app singleton.
// All operations use upsert for idempotency (safe to run multiple times).
// ============================================================================

import { PrismaClient, SeniorityLevel, DegreeLevel, DayOfWeek } from '@prisma/client';
import bcrypt from 'bcryptjs';

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
// Seed: Academic Dummy Data (Phase 5 Testing)
// ---------------------------------------------------------------------------

async function seedDummyData(schoolId: string) {
  console.log('🌱 Seeding rich academic dummy data...');

  // 1. Semester
  const semester = await prisma.semester.upsert({
    where: { id: 'sem-odd-2026' },
    update: {
      name: 'Odd Sem 2026',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-12-15'),
      isActive: true,
    },
    create: {
      id: 'sem-odd-2026',
      name: 'Odd Sem 2026',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-12-15'),
      isActive: true,
    },
  });
  console.log(`  ✔ Semester upserted: ${semester.name}`);

  // 2. Departments
  const deptCse = await prisma.department.upsert({
    where: { schoolId_shortCode: { schoolId, shortCode: 'CSE' } },
    update: {},
    create: {
      name: 'Computer Science & Engineering',
      shortCode: 'CSE',
      schoolId,
    },
  });
  const deptIt = await prisma.department.upsert({
    where: { schoolId_shortCode: { schoolId, shortCode: 'IT' } },
    update: {},
    create: {
      name: 'Information Technology',
      shortCode: 'IT',
      schoolId,
    },
  });
  console.log(`  ✔ Departments upserted: CSE, IT`);

  // 3. Batches
  const batchCse3A = await prisma.batch.upsert({
    where: { semesterId_name: { semesterId: semester.id, name: 'CSE-3A' } },
    update: {},
    create: {
      name: 'CSE-3A',
      departmentId: deptCse.id,
      semesterId: semester.id,
      degreeLevel: 'UG',
      yearOrSemesterNumber: 3,
      strength: 60,
    },
  });
  const batchIt2B = await prisma.batch.upsert({
    where: { semesterId_name: { semesterId: semester.id, name: 'IT-2B' } },
    update: {},
    create: {
      name: 'IT-2B',
      departmentId: deptIt.id,
      semesterId: semester.id,
      degreeLevel: 'UG',
      yearOrSemesterNumber: 2,
      strength: 50,
    },
  });
  const batchCsePg1 = await prisma.batch.upsert({
    where: { semesterId_name: { semesterId: semester.id, name: 'CSE-PG1' } },
    update: {},
    create: {
      name: 'CSE-PG1',
      departmentId: deptCse.id,
      semesterId: semester.id,
      degreeLevel: 'PG',
      yearOrSemesterNumber: 1,
      strength: 20,
    },
  });
  console.log(`  ✔ Batches upserted: CSE-3A, IT-2B, CSE-PG1`);

  // 4. Faculty
  const fAlice = await prisma.faculty.upsert({
    where: { email: 'alice.johnson@university.edu' },
    update: {},
    create: {
      fullName: 'Dr. Alice Johnson',
      email: 'alice.johnson@university.edu',
      departmentId: deptCse.id,
      seniorityLevel: 'HOD',
      maxClassesPerDay: 4,
      maxClassesPerWeek: 16,
      maxContinuousClasses: 3,
      weeklyWorkingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    },
  });
  const fBob = await prisma.faculty.upsert({
    where: { email: 'bob.smith@university.edu' },
    update: {},
    create: {
      fullName: 'Dr. Bob Smith',
      email: 'bob.smith@university.edu',
      departmentId: deptCse.id,
      seniorityLevel: 'PROFESSOR',
      maxClassesPerDay: 4,
      maxClassesPerWeek: 16,
      maxContinuousClasses: 3,
      weeklyWorkingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    },
  });
  const fCarol = await prisma.faculty.upsert({
    where: { email: 'carol.white@university.edu' },
    update: {},
    create: {
      fullName: 'Dr. Carol White',
      email: 'carol.white@university.edu',
      departmentId: deptIt.id,
      seniorityLevel: 'ASSOCIATE_PROFESSOR',
      maxClassesPerDay: 4,
      maxClassesPerWeek: 16,
      maxContinuousClasses: 3,
      weeklyWorkingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    },
  });
  const fDavid = await prisma.faculty.upsert({
    where: { email: 'david.green@university.edu' },
    update: {},
    create: {
      fullName: 'Prof. David Green',
      email: 'david.green@university.edu',
      departmentId: deptCse.id,
      seniorityLevel: 'ASSISTANT_PROFESSOR',
      maxClassesPerDay: 5,
      maxClassesPerWeek: 20,
      maxContinuousClasses: 3,
      weeklyWorkingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
    },
  });
  const fEmma = await prisma.faculty.upsert({
    where: { email: 'emma.blue@university.edu' },
    update: {},
    create: {
      fullName: 'Prof. Emma Blue',
      email: 'emma.blue@university.edu',
      departmentId: deptIt.id,
      seniorityLevel: 'ASSISTANT_PROFESSOR',
      maxClassesPerDay: 5,
      maxClassesPerWeek: 20,
      maxContinuousClasses: 3,
      weeklyWorkingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
    },
  });
  console.log(`  ✔ Faculty members upserted: Dr. Alice, Dr. Bob, Dr. Carol, Prof. David, Prof. Emma`);

  // 5. Rooms
  const room101 = await prisma.room.upsert({
    where: { schoolId_name: { schoolId, name: 'Room 101' } },
    update: {},
    create: {
      name: 'Room 101',
      capacity: 70,
      roomType: 'LECTURE_HALL',
      schoolId,
    },
  });
  const room102 = await prisma.room.upsert({
    where: { schoolId_name: { schoolId, name: 'Room 102' } },
    update: {},
    create: {
      name: 'Room 102',
      capacity: 60,
      roomType: 'LECTURE_HALL',
      schoolId,
    },
  });
  const labA = await prisma.room.upsert({
    where: { schoolId_name: { schoolId, name: 'Lab A' } },
    update: {},
    create: {
      name: 'Lab A',
      capacity: 40,
      roomType: 'LAB',
      schoolId,
    },
  });
  console.log(`  ✔ Rooms upserted: Room 101, Room 102, Lab A`);

  // 6. Subjects
  const subDs = await prisma.subject.upsert({
    where: { departmentId_code: { departmentId: deptCse.id, code: 'CS201' } },
    update: {},
    create: {
      name: 'Data Structures',
      code: 'CS201',
      departmentId: deptCse.id,
      degreeLevel: 'UG',
      classType: 'LECTURE',
      weeklyClassesRequired: 3,
    },
  });
  const subAlgoLab = await prisma.subject.upsert({
    where: { departmentId_code: { departmentId: deptCse.id, code: 'CS202' } },
    update: {},
    create: {
      name: 'Algorithms Lab',
      code: 'CS202',
      departmentId: deptCse.id,
      degreeLevel: 'UG',
      classType: 'LAB',
      weeklyClassesRequired: 2,
    },
  });
  const subMl = await prisma.subject.upsert({
    where: { departmentId_code: { departmentId: deptCse.id, code: 'CS501' } },
    update: {},
    create: {
      name: 'Advanced Machine Learning',
      code: 'CS501',
      departmentId: deptCse.id,
      degreeLevel: 'PG',
      classType: 'LECTURE',
      weeklyClassesRequired: 3,
    },
  });
  const subOs = await prisma.subject.upsert({
    where: { departmentId_code: { departmentId: deptIt.id, code: 'IT201' } },
    update: {},
    create: {
      name: 'Operating Systems',
      code: 'IT201',
      departmentId: deptIt.id,
      degreeLevel: 'UG',
      classType: 'LECTURE',
      weeklyClassesRequired: 3,
    },
  });
  console.log(`  ✔ Subjects upserted: CS201, CS202, CS501, IT201`);

  // 7. Preferences
  await prisma.facultyPreferredSubject.upsert({
    where: { facultyId_subjectId: { facultyId: fAlice.id, subjectId: subMl.id } },
    update: {},
    create: { facultyId: fAlice.id, subjectId: subMl.id, preferenceRank: 1 },
  });
  await prisma.facultyPreferredSubject.upsert({
    where: { facultyId_subjectId: { facultyId: fBob.id, subjectId: subDs.id } },
    update: {},
    create: { facultyId: fBob.id, subjectId: subDs.id, preferenceRank: 1 },
  });
  await prisma.facultyPreferredSubject.upsert({
    where: { facultyId_subjectId: { facultyId: fDavid.id, subjectId: subDs.id } },
    update: {},
    create: { facultyId: fDavid.id, subjectId: subDs.id, preferenceRank: 2 },
  });
  console.log(`  ✔ Faculty Preferred Subjects mapped`);

  // 8. ClassRequirements (To test allocation)
  await prisma.classRequirement.upsert({
    where: { id: 'req-cse-ds' },
    update: {},
    create: {
      id: 'req-cse-ds',
      semesterId: semester.id,
      subjectId: subDs.id,
      batchId: batchCse3A.id,
      roomId: room101.id,
      classType: 'LECTURE',
      sessionsPerWeek: 3,
      status: 'UNASSIGNED',
    },
  });
  await prisma.classRequirement.upsert({
    where: { id: 'req-cse-algo-lab' },
    update: {},
    create: {
      id: 'req-cse-algo-lab',
      semesterId: semester.id,
      subjectId: subAlgoLab.id,
      batchId: batchCse3A.id,
      roomId: labA.id,
      classType: 'LAB',
      sessionsPerWeek: 2,
      status: 'UNASSIGNED',
    },
  });
  await prisma.classRequirement.upsert({
    where: { id: 'req-cse-ml' },
    update: {},
    create: {
      id: 'req-cse-ml',
      semesterId: semester.id,
      subjectId: subMl.id,
      batchId: batchCsePg1.id,
      roomId: room102.id,
      classType: 'LECTURE',
      sessionsPerWeek: 3,
      status: 'UNASSIGNED',
    },
  });
  await prisma.classRequirement.upsert({
    where: { id: 'req-it-os' },
    update: {},
    create: {
      id: 'req-it-os',
      semesterId: semester.id,
      subjectId: subOs.id,
      batchId: batchIt2B.id,
      roomId: room101.id,
      classType: 'LECTURE',
      sessionsPerWeek: 3,
      status: 'UNASSIGNED',
    },
  });
  console.log(`  ✔ ClassRequirements created. Solver is fully testable!`);

  // 9. Batch Preferences
  await prisma.facultyPreferredBatch.upsert({
    where: { facultyId_batchId: { facultyId: fBob.id, batchId: batchCse3A.id } },
    update: {},
    create: { facultyId: fBob.id, batchId: batchCse3A.id, preferenceRank: 1 },
  });
  await prisma.facultyPreferredBatch.upsert({
    where: { facultyId_batchId: { facultyId: fDavid.id, batchId: batchIt2B.id } },
    update: {},
    create: { facultyId: fDavid.id, batchId: batchIt2B.id, preferenceRank: 2 },
  });
  console.log(`  ✔ Faculty Preferred Batches mapped`);
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

  await seedDummyData(school.id);
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
