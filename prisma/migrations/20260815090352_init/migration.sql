-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'SCHOOL_ADMIN', 'DEPT_ADMIN');

-- CreateEnum
CREATE TYPE "SeniorityLevel" AS ENUM ('ASSISTANT_PROFESSOR', 'ASSOCIATE_PROFESSOR', 'PROFESSOR', 'HOD');

-- CreateEnum
CREATE TYPE "DegreeLevel" AS ENUM ('UG', 'PG');

-- CreateEnum
CREATE TYPE "ClassType" AS ENUM ('LECTURE', 'LAB', 'TUTORIAL');

-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('LECTURE_HALL', 'LAB', 'SEMINAR_ROOM');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY');

-- CreateEnum
CREATE TYPE "ClassRequirementStatus" AS ENUM ('UNASSIGNED', 'AUTO_ASSIGNED', 'MANUALLY_ASSIGNED', 'CONFLICT');

-- CreateEnum
CREATE TYPE "AllocationRunStatus" AS ENUM ('SUCCESS', 'PARTIAL', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "schoolId" TEXT,
    "departmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faculty" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "seniorityLevel" "SeniorityLevel" NOT NULL,
    "maxClassesPerDay" INTEGER NOT NULL DEFAULT 5,
    "maxClassesPerWeek" INTEGER NOT NULL DEFAULT 20,
    "maxContinuousClasses" INTEGER NOT NULL DEFAULT 3,
    "minGapAfterContinuousBlock" INTEGER NOT NULL DEFAULT 1,
    "weeklyWorkingDays" "DayOfWeek"[],
    "dailyAvailableFrom" TEXT,
    "dailyAvailableTo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Faculty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyPreferredSubject" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "preferenceRank" INTEGER NOT NULL,

    CONSTRAINT "FacultyPreferredSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyUnavailability" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacultyUnavailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "degreeLevel" "DegreeLevel" NOT NULL,
    "classType" "ClassType" NOT NULL,
    "weeklyClassesRequired" INTEGER NOT NULL,
    "creditHours" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Semester" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Semester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "degreeLevel" "DegreeLevel" NOT NULL,
    "yearOrSemesterNumber" INTEGER NOT NULL,
    "strength" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "roomType" "RoomType" NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeSlot" (
    "id" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "periodNumber" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "isBreak" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeniorityDegreeEligibility" (
    "id" TEXT NOT NULL,
    "seniorityLevel" "SeniorityLevel" NOT NULL,
    "degreeLevel" "DegreeLevel" NOT NULL,
    "allowed" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SeniorityDegreeEligibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassRequirement" (
    "id" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "classType" "ClassType" NOT NULL,
    "sessionsPerWeek" INTEGER NOT NULL,
    "assignedFacultyId" TEXT,
    "assignedTimeSlotIds" TEXT[],
    "status" "ClassRequirementStatus" NOT NULL DEFAULT 'UNASSIGNED',
    "conflictReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllocationRun" (
    "id" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "runByUserId" TEXT NOT NULL,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "AllocationRunStatus" NOT NULL,
    "summaryJson" JSONB NOT NULL,

    CONSTRAINT "AllocationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "previousValues" JSONB,
    "newValues" JSONB,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "School_shortCode_key" ON "School"("shortCode");

-- CreateIndex
CREATE INDEX "School_shortCode_idx" ON "School"("shortCode");

-- CreateIndex
CREATE INDEX "Department_schoolId_idx" ON "Department"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_schoolId_shortCode_key" ON "Department"("schoolId", "shortCode");

-- CreateIndex
CREATE UNIQUE INDEX "Faculty_email_key" ON "Faculty"("email");

-- CreateIndex
CREATE INDEX "Faculty_departmentId_idx" ON "Faculty"("departmentId");

-- CreateIndex
CREATE INDEX "Faculty_email_idx" ON "Faculty"("email");

-- CreateIndex
CREATE INDEX "Faculty_seniorityLevel_idx" ON "Faculty"("seniorityLevel");

-- CreateIndex
CREATE INDEX "FacultyPreferredSubject_facultyId_idx" ON "FacultyPreferredSubject"("facultyId");

-- CreateIndex
CREATE INDEX "FacultyPreferredSubject_subjectId_idx" ON "FacultyPreferredSubject"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "FacultyPreferredSubject_facultyId_subjectId_key" ON "FacultyPreferredSubject"("facultyId", "subjectId");

-- CreateIndex
CREATE INDEX "FacultyUnavailability_facultyId_idx" ON "FacultyUnavailability"("facultyId");

-- CreateIndex
CREATE INDEX "FacultyUnavailability_startDate_endDate_idx" ON "FacultyUnavailability"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "Subject_departmentId_idx" ON "Subject"("departmentId");

-- CreateIndex
CREATE INDEX "Subject_degreeLevel_idx" ON "Subject"("degreeLevel");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_departmentId_code_key" ON "Subject"("departmentId", "code");

-- CreateIndex
CREATE INDEX "Semester_isActive_idx" ON "Semester"("isActive");

-- CreateIndex
CREATE INDEX "Batch_departmentId_idx" ON "Batch"("departmentId");

-- CreateIndex
CREATE INDEX "Batch_semesterId_idx" ON "Batch"("semesterId");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_semesterId_name_key" ON "Batch"("semesterId", "name");

-- CreateIndex
CREATE INDEX "Room_schoolId_idx" ON "Room"("schoolId");

-- CreateIndex
CREATE INDEX "Room_roomType_idx" ON "Room"("roomType");

-- CreateIndex
CREATE UNIQUE INDEX "Room_schoolId_name_key" ON "Room"("schoolId", "name");

-- CreateIndex
CREATE INDEX "TimeSlot_schoolId_idx" ON "TimeSlot"("schoolId");

-- CreateIndex
CREATE INDEX "TimeSlot_dayOfWeek_idx" ON "TimeSlot"("dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "TimeSlot_schoolId_dayOfWeek_periodNumber_key" ON "TimeSlot"("schoolId", "dayOfWeek", "periodNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SeniorityDegreeEligibility_seniorityLevel_degreeLevel_key" ON "SeniorityDegreeEligibility"("seniorityLevel", "degreeLevel");

-- CreateIndex
CREATE INDEX "ClassRequirement_semesterId_idx" ON "ClassRequirement"("semesterId");

-- CreateIndex
CREATE INDEX "ClassRequirement_status_idx" ON "ClassRequirement"("status");

-- CreateIndex
CREATE INDEX "ClassRequirement_assignedFacultyId_idx" ON "ClassRequirement"("assignedFacultyId");

-- CreateIndex
CREATE INDEX "ClassRequirement_batchId_idx" ON "ClassRequirement"("batchId");

-- CreateIndex
CREATE INDEX "ClassRequirement_subjectId_idx" ON "ClassRequirement"("subjectId");

-- CreateIndex
CREATE INDEX "AllocationRun_semesterId_idx" ON "AllocationRun"("semesterId");

-- CreateIndex
CREATE INDEX "AllocationRun_runAt_idx" ON "AllocationRun"("runAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Faculty" ADD CONSTRAINT "Faculty_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyPreferredSubject" ADD CONSTRAINT "FacultyPreferredSubject_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyPreferredSubject" ADD CONSTRAINT "FacultyPreferredSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyUnavailability" ADD CONSTRAINT "FacultyUnavailability_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeSlot" ADD CONSTRAINT "TimeSlot_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassRequirement" ADD CONSTRAINT "ClassRequirement_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassRequirement" ADD CONSTRAINT "ClassRequirement_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassRequirement" ADD CONSTRAINT "ClassRequirement_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassRequirement" ADD CONSTRAINT "ClassRequirement_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassRequirement" ADD CONSTRAINT "ClassRequirement_assignedFacultyId_fkey" FOREIGN KEY ("assignedFacultyId") REFERENCES "Faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllocationRun" ADD CONSTRAINT "AllocationRun_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllocationRun" ADD CONSTRAINT "AllocationRun_runByUserId_fkey" FOREIGN KEY ("runByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
